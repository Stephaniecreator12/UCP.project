import secrets

from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.evaluation_offre.models import EvaluationOffre, EvaluationSeanceAssignation

VALIDATION_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_evaluation_password(reference="", participant_key=""):
    import re
    clean_ref = re.sub(r'[^A-Za-z0-9]', '', reference).upper()[:8]
    clean_key = re.sub(r'[^A-Za-z0-9]', '', participant_key).upper()[:10]
    random_part = "".join(secrets.choice(VALIDATION_ALPHABET) for _ in range(6))
    if clean_ref and clean_key:
        return f"{clean_ref}-{clean_key}-{random_part}"
    if clean_ref:
        return f"{clean_ref}-{random_part}"
    if clean_key:
        return f"EVAL-{clean_key}-{random_part}"

    random_part2 = "".join(secrets.choice(VALIDATION_ALPHABET) for _ in range(6))
    return f"EVAL-{random_part}-{random_part2}"


def issue_evaluation_password(evaluation: EvaluationOffre):
    reference = getattr(evaluation.offre.seance, "reference_dossier", "")
    participant_key = f"E{evaluation.pk}"
    password = generate_evaluation_password(reference, participant_key)
    now = timezone.now()
    evaluation.evaluation_password_hash = make_password(password)
    evaluation.evaluation_password_generated_at = now
    evaluation.evaluation_password_consumed_at = None
    evaluation.save(update_fields=[
        "evaluation_password_hash",
        "evaluation_password_generated_at",
        "evaluation_password_consumed_at",
    ])
    return password


def check_evaluation_password(evaluation: EvaluationOffre, email: str = "", password: str = ""):
    submitted_password = (password or "").strip()
    if not submitted_password:
        raise ValidationError({"password": "Mot de passe d'évaluation obligatoire."})
    if not evaluation.evaluation_password_hash:
        raise ValidationError({"detail": "Le code d'évaluation n'est plus actif."})
    if not check_password(submitted_password, evaluation.evaluation_password_hash):
        raise ValidationError({"password": "Code d'évaluation incorrect."})
    return True


def get_evaluation_with_password(offre_id: int, email: str = "", password: str = ""):
    from django.contrib.auth.hashers import check_password

    submitted_password = (password or "").strip()
    if not submitted_password:
        raise ValidationError({"password": "Code d'évaluation obligatoire."})

    evaluations = EvaluationOffre.objects.select_related("evaluateur", "offre__seance").filter(offre_id=offre_id)
    if email:
        evaluations = evaluations.filter(evaluateur_email__iexact=email) | evaluations.filter(evaluateur__email__iexact=email)

    for candidate in evaluations:
        if candidate.evaluation_password_hash and check_password(submitted_password, candidate.evaluation_password_hash):
            return candidate
        if candidate.evaluateur and candidate.evaluateur.has_usable_password() and candidate.evaluateur.check_password(submitted_password):
            return candidate

    raise ValidationError({"password": "Code d'évaluation ou mot de passe incorrect pour cette offre."})


def issue_seance_password(assignation: EvaluationSeanceAssignation) -> str:
    reference = getattr(assignation.seance, "reference_dossier", "")
    participant_key = f"S{assignation.seance_id}E{assignation.evaluateur_id}"
    password = generate_evaluation_password(reference, participant_key)
    now = timezone.now()
    assignation.evaluation_password_hash = make_password(password)
    assignation.evaluation_password_generated_at = now
    assignation.evaluation_password_revoked_at = None
    assignation.save(update_fields=[
        "evaluation_password_hash",
        "evaluation_password_generated_at",
        "evaluation_password_revoked_at",
    ])
    return password


def authenticate_seance_assignation(
    email: str = "",
    password: str = "",
    seance_id: int | None = None,
) -> EvaluationSeanceAssignation:
    submitted_password = (password or "").strip()
    if not submitted_password:
        raise ValidationError({"password": "Mot de passe d'accès obligatoire."})

    clean_email = email.strip()
    
    assignations = (
        EvaluationSeanceAssignation.objects
        .select_related("evaluateur", "seance")
        .filter(evaluateur_email__iexact=clean_email)
        .filter(evaluation_password_revoked_at__isnull=True)
    )
    
    if seance_id:
        assignations = assignations.filter(seance_id=seance_id)
    
    # Si aucune assignation trouvée, donner un message spécifique
    if not assignations.exists():
        all_with_email = EvaluationSeanceAssignation.objects.filter(
            evaluateur_email__iexact=clean_email
        )
        
        if seance_id and not all_with_email.filter(seance_id=seance_id).exists():
            raise ValidationError({
                "detail": f"Aucun accès trouvé pour cet email dans ce DAO."
            })
        
        if not all_with_email.exists():
            raise ValidationError({
                "detail": f"Email '{clean_email}' non trouvé. Vérifiez le mail reçu."
            })
        
        # Si email trouvé mais accès expiré
        expired = all_with_email.filter(evaluation_password_revoked_at__isnull=False).exists()
        if expired:
            raise ValidationError({
                "detail": "Votre accès a expiré. Contactez l'administrateur."
            })

    for assignation in assignations:
        if assignation.evaluation_password_hash and check_password(submitted_password, assignation.evaluation_password_hash):
            return assignation
        if assignation.evaluateur and assignation.evaluateur.has_usable_password() and assignation.evaluateur.check_password(submitted_password):
            return assignation

    raise ValidationError({
        "detail": "Code d'accès ou mot de passe incorrect. Vérifiez les informations saisies."
    })


def verify_evaluator_password(user, password: str = "", seance_id: int | None = None) -> bool:
    from django.contrib.auth.hashers import check_password

    submitted = (password or "").strip()
    if not submitted:
        raise ValidationError({"password": "Mot de passe obligatoire."})

    if seance_id:
        assignation = (
            EvaluationSeanceAssignation.objects
            .filter(
                seance_id=seance_id,
                evaluateur=user,
                evaluation_password_revoked_at__isnull=True,
            )
            .exclude(evaluation_password_hash="")
            .first()
        )
        if assignation and check_password(submitted, assignation.evaluation_password_hash):
            return True

    if hasattr(user, "check_password") and user.check_password(submitted):
        return True

    raise ValidationError({"password": "Mot de passe incorrect."})


def revoke_seance_passwords(seance_id: int) -> None:
    now = timezone.now()
    EvaluationSeanceAssignation.objects.filter(seance_id=seance_id).update(
        evaluation_password_hash="",
        evaluation_password_revoked_at=now,
    )
