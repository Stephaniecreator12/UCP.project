import secrets

from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.ouverture_offre.models import MembreSeance, SeanceOuverture


VALIDATION_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_validation_password(reference="", participant_key=""):
    import re
    clean_ref = re.sub(r'[^A-Za-z0-9]', '', reference).upper()[:8]
    clean_key = re.sub(r'[^A-Za-z0-9]', '', participant_key).upper()[:10]
    random_part = "".join(secrets.choice(VALIDATION_ALPHABET) for _ in range(6))
    if clean_ref and clean_key:
        return f"{clean_ref}-{clean_key}-{random_part}"
    if clean_ref:
        return f"{clean_ref}-{random_part}"
    if clean_key:
        return f"VAL-{clean_key}-{random_part}"

    # Fallback if reference was empty
    random_part2 = "".join(secrets.choice(VALIDATION_ALPHABET) for _ in range(6))
    return f"VAL-{random_part}-{random_part2}"


def issue_member_validation_password(membre: MembreSeance):
    password = generate_validation_password(
        membre.seance.reference_dossier,
        f"M{membre.id}",
    )
    now = timezone.now()
    membre.validation_password_hash = make_password(password)
    membre.validation_password_generated_at = now
    membre.validation_password_consumed_at = None
    membre.save(
        update_fields=[
            "validation_password_hash",
            "validation_password_generated_at",
            "validation_password_consumed_at",
        ]
    )
    return password


def issue_president_validation_password(seance: SeanceOuverture):
    password = generate_validation_password(
        seance.reference_dossier,
        f"P{seance.president_id or seance.id}",
    )
    now = timezone.now()
    seance.president_validation_password_hash = make_password(password)
    seance.president_validation_password_generated_at = now
    seance.president_validation_password_consumed_at = None
    seance.save(
        update_fields=[
            "president_validation_password_hash",
            "president_validation_password_generated_at",
            "president_validation_password_consumed_at",
            "updated_at",
        ]
    )
    return password


def clear_member_validation_password(membre: MembreSeance):
    membre.validation_password_hash = ""
    membre.validation_password_consumed_at = timezone.now()
    membre.save(
        update_fields=[
            "validation_password_hash",
            "validation_password_consumed_at",
        ]
    )


def clear_president_validation_password(seance: SeanceOuverture):
    seance.president_validation_password_hash = ""
    seance.president_validation_password_consumed_at = timezone.now()
    seance.save(
        update_fields=[
            "president_validation_password_hash",
            "president_validation_password_consumed_at",
            "updated_at",
        ]
    )


def get_member_with_password(seance: SeanceOuverture, email: str = "", password: str = ""):
    clean_email = (email or "").strip()
    submitted_password = (password or "").strip()
    if not submitted_password:
        raise ValidationError({"password": "Mot de passe de validation obligatoire."})

    members = seance.membres.select_related("utilisateur").filter(est_present=True)
    if clean_email:
        members = members.filter(utilisateur__email__iexact=clean_email)

    membre = (
        members
        .filter(decision=MembreSeance.Decision.EN_ATTENTE)
        .exclude(validation_password_hash="")
    )

    if clean_email and not members.exists():
        raise PermissionDenied({"detail": "Aucun membre de commission ne correspond a cet email."})

    for candidate in membre:
        if check_password(submitted_password, candidate.validation_password_hash):
            return candidate

    if clean_email and members.filter(decision=MembreSeance.Decision.EN_ATTENTE).exists():
        raise ValidationError({"password": "Mot de passe de validation incorrect."})
    if clean_email:
        raise ValidationError({"detail": "Cette validation membre est deja terminee ou le mot de passe n'est plus actif."})
    raise ValidationError({"password": "Mot de passe de validation incorrect ou expire pour cette seance."})


def check_president_password(seance: SeanceOuverture, email: str = "", password: str = ""):
    clean_email = (email or "").strip()
    submitted_password = (password or "").strip()
    if not submitted_password:
        raise ValidationError({"password": "Mot de passe de validation obligatoire."})
    if not seance.president:
        raise ValidationError({"detail": "Aucun president n'est associe a cette seance."})
    if clean_email and (seance.president.email or "").lower() != clean_email.lower():
        raise PermissionDenied({"detail": "Cet email ne correspond pas au president de cette seance."})
    if seance.president_decision != SeanceOuverture.Decision.EN_ATTENTE:
        raise ValidationError({"detail": "La decision du president est deja terminee."})
    if not seance.president_validation_password_hash:
        raise ValidationError({"detail": "Le mot de passe de validation n'est plus actif."})
    if not check_password(submitted_password, seance.president_validation_password_hash):
        raise ValidationError({"password": "Mot de passe de validation incorrect."})
    return seance.president
