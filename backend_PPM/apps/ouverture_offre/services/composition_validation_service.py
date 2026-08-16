from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.ouverture_offre.models import SeanceOuverture, ValidationCompositionMembre
from apps.ouverture_offre.services.notification_service import (
    notify_composition_validators_requested,
)
from apps.ouverture_offre.services.seance_service import (
    replace_members_from_commission,
)

User = get_user_model()

COMPOSITION_ROLE_GROUPS = {
    ValidationCompositionMembre.RoleValidateur.RPM: (
        "RPM",
        "VALIDATEUR_PROGRAMMATIQUE",
    ),
    ValidationCompositionMembre.RoleValidateur.GP: (
        "GP",
        "VALIDATEUR_TECHNIQUE",
    ),
    ValidationCompositionMembre.RoleValidateur.CN: (
        "CN",
        "APPROBATEUR_NATIONAL",
    ),
}

COMPOSITION_GROUP_TO_ROLE = {
    group: role
    for role, group_names in COMPOSITION_ROLE_GROUPS.items()
    for group in group_names
}
COMPOSITION_ROLE_SEQUENCE = (
    ValidationCompositionMembre.RoleValidateur.RPM,
    ValidationCompositionMembre.RoleValidateur.GP,
    ValidationCompositionMembre.RoleValidateur.CN,
)
URGENT_DELAY_DAYS = 3


def get_user_composition_role(user) -> str | None:
    if not user or not user.is_authenticated:
        return None

    group_names = set(user.groups.values_list("name", flat=True))
    for group, role in COMPOSITION_GROUP_TO_ROLE.items():
        if group in group_names:
            return role
    return None


def _users_for_role(role: str):
    group_names = COMPOSITION_ROLE_GROUPS.get(role, ())
    if not group_names:
        return User.objects.none()
    return User.objects.filter(groups__name__in=group_names, is_active=True).distinct()


def _role_index(role: str | None) -> int:
    if role not in COMPOSITION_ROLE_SEQUENCE:
        return 999
    return COMPOSITION_ROLE_SEQUENCE.index(role)


def _ordered_validations(seance: SeanceOuverture):
    return sorted(
        seance.validations_composition.all(),
        key=lambda validation: _role_index(validation.role),
    )


def _get_validation_for_role(seance: SeanceOuverture, role: str | None):
    if not role:
        return None
    return seance.validations_composition.filter(role=role).first()


def _has_rejection(seance: SeanceOuverture) -> ValidationCompositionMembre | None:
    for validation in _ordered_validations(seance):
        if validation.decision == ValidationCompositionMembre.Decision.REJETEE:
            return validation
    return None


def _get_current_validation(seance: SeanceOuverture):
    rejected = _has_rejection(seance)
    if rejected:
        return rejected

    for validation in _ordered_validations(seance):
        if (
            validation.decision == ValidationCompositionMembre.Decision.EN_ATTENTE
            and validation.notification_sent_at
        ):
            return validation
    return None


def get_active_composition_role(seance: SeanceOuverture) -> str | None:
    current = _get_current_validation(seance)
    if current:
        return current.role

    next_validation = _get_next_pending_validation(seance)
    return next_validation.role if next_validation else None


def _get_next_pending_validation(seance: SeanceOuverture):
    for validation in _ordered_validations(seance):
        if validation.decision == ValidationCompositionMembre.Decision.EN_ATTENTE:
            return validation
    return None


def is_composition_urgent(seance: SeanceOuverture) -> bool:
    if not seance.date_soumission_membres:
        return False
    deadline = seance.date_soumission_membres + timedelta(days=URGENT_DELAY_DAYS)
    return timezone.now() > deadline


def get_composition_dashboard_statut(seance: SeanceOuverture) -> str:
    if _has_rejection(seance):
        return "REJETEE"

    if seance.statut in (
        SeanceOuverture.Statut.BROUILLON,
        SeanceOuverture.Statut.EN_SAISIE,
    ):
        return "BROUILLON"

    if seance.statut == SeanceOuverture.Statut.REJETEE:
        return "REJETEE"

    if seance.membres_verrouilles or seance.statut == SeanceOuverture.Statut.MEMBRES_CONFIRMES:
        return "VALIDEE"

    current_validation = _get_current_validation(seance)
    if current_validation:
        if current_validation.decision == ValidationCompositionMembre.Decision.REJETEE:
            return "REJETEE"
        return f"EN_ATTENTE_{current_validation.role}"

    next_validation = _get_next_pending_validation(seance)
    if next_validation:
        return f"EN_ATTENTE_{next_validation.role}"

    return "BROUILLON"


def _build_validation_summary(validation: ValidationCompositionMembre) -> dict:
    return {
        "role": validation.role,
        "decision": validation.decision,
        "validateur": validation.validateur_id,
        "date_validation": validation.date_validation,
        "notification_sent_at": validation.notification_sent_at,
    }


def _send_validation_for_role(validation: ValidationCompositionMembre) -> int:
    if validation.notification_sent_at is None:
        validation.notification_sent_at = timezone.now()
        validation.save(update_fields=["notification_sent_at"])
    return notify_composition_validators_requested(validation.seance, role=validation.role)


def _clear_validation_prefetch_cache(seance: SeanceOuverture):
    if hasattr(seance, "_prefetched_objects_cache"):
        seance._prefetched_objects_cache.pop("validations_composition", None)


def _get_next_pending_validation(seance: SeanceOuverture):
    _clear_validation_prefetch_cache(seance)
    validations = {
        v.role: v for v in ValidationCompositionMembre.objects.filter(seance=seance)
    }
    for role in COMPOSITION_ROLE_SEQUENCE:
        v = validations.get(role)
        if v and v.decision == ValidationCompositionMembre.Decision.EN_ATTENTE:
            return v
    return None


def _start_validation_workflow(seance: SeanceOuverture) -> int:
    ValidationCompositionMembre.objects.filter(seance=seance).delete()
    for role in COMPOSITION_ROLE_SEQUENCE:
        ValidationCompositionMembre.objects.create(
            seance=seance,
            role=role,
            decision=ValidationCompositionMembre.Decision.EN_ATTENTE,
        )

    _clear_validation_prefetch_cache(seance)

    seance.membres_verrouilles = False
    seance.statut = SeanceOuverture.Statut.EN_VALIDATION_MEMBRES
    seance.date_soumission_membres = timezone.now()
    seance.save(
        update_fields=[
            "membres_verrouilles",
            "statut",
            "date_soumission_membres",
            "updated_at",
        ]
    )

    first_validation = _get_next_pending_validation(seance)
    if not first_validation:
        return 0
    return _send_validation_for_role(first_validation)


@transaction.atomic
def start_composition_validation_workflow(seance: SeanceOuverture) -> int:
    return _start_validation_workflow(seance)


def list_composition_pending(user) -> list[dict]:
    role = get_user_composition_role(user)
    if not role:
        raise PermissionDenied({"detail": "Accès réservé aux validateurs CN/GP/RPM."})

    seances = (
        SeanceOuverture.objects.filter(validations_composition__role=role)
        .filter(
            Q(validations_composition__notification_sent_at__isnull=False)
            | Q(
                validations_composition__decision__in=[
                    ValidationCompositionMembre.Decision.VALIDEE,
                    ValidationCompositionMembre.Decision.REJETEE,
                ]
            )
        )
        .prefetch_related(
            "membres__utilisateur",
            "validations_composition",
            "validations_composition__validateur",
        )
        .distinct()
        .order_by("-date_soumission_membres", "-updated_at")
    )

    result = []
    for seance in seances:
        validation = _get_validation_for_role(seance, role)
        if not validation:
            continue

        if (
            validation.decision == ValidationCompositionMembre.Decision.EN_ATTENTE
            and get_active_composition_role(seance) != role
        ):
            continue

        validations = [_build_validation_summary(v) for v in _ordered_validations(seance)]
        result.append(
            {
                "seance_id": seance.id,
                "reference_dossier": seance.reference_dossier,
                "objet_dossier": seance.objet_dossier,
                "date_soumission_membres": seance.date_soumission_membres,
                "membres_count": seance.membres.filter(est_present=True).count(),
                "statut_dashboard": get_composition_dashboard_statut(seance),
                "est_urgent": is_composition_urgent(seance),
                "validations": validations,
                "ma_decision": validation.decision,
            }
        )
    return result


def get_composition_detail(seance_id: int, user) -> dict:
    role = get_user_composition_role(user)
    if not role:
        raise PermissionDenied({"detail": "Accès réservé aux validateurs CN/GP/RPM."})

    seance = (
        SeanceOuverture.objects.filter(pk=seance_id)
        .prefetch_related(
            "membres__utilisateur",
            "validations_composition",
            "validations_composition__validateur",
        )
        .first()
    )
    if not seance:
        raise ValidationError({"detail": "Séance introuvable."})

    validation = _get_validation_for_role(seance, role)
    if not validation:
        raise PermissionDenied({"detail": "Vous n'êtes pas autorisé sur cette séance."})

    if (
        validation.decision == ValidationCompositionMembre.Decision.EN_ATTENTE
        and get_active_composition_role(seance) != role
    ):
        raise PermissionDenied({"detail": "Votre validation n'est pas encore active."})

    membres = [
        {
            "nom_prenom": m.nom_prenom,
            "email": m.utilisateur.email if m.utilisateur else "",
            "poste": m.poste,
            "entite": m.intitule,
            "numero_carte": m.numero_carte,
        }
        for m in seance.membres.filter(est_present=True)
    ]

    return {
        "seance_id": seance.id,
        "reference_dossier": seance.reference_dossier,
        "objet_dossier": seance.objet_dossier,
        "statut": seance.statut,
        "membres": membres,
        "statut_dashboard": get_composition_dashboard_statut(seance),
        "est_urgent": is_composition_urgent(seance),
        "ma_decision": validation.decision,
        "validations": [_build_validation_summary(v) for v in _ordered_validations(seance)],
    }


def _finalize_composition_if_done(seance: SeanceOuverture):
    validations = list(_ordered_validations(seance))
    if len(validations) < len(COMPOSITION_ROLE_SEQUENCE):
        return seance

    if any(
        validation.decision == ValidationCompositionMembre.Decision.REJETEE
        for validation in validations
    ):
        seance.membres_verrouilles = False
        seance.statut = SeanceOuverture.Statut.EN_SAISIE
        seance.save(update_fields=["membres_verrouilles", "statut", "updated_at"])
        return seance

    if not all(
        validation.decision == ValidationCompositionMembre.Decision.VALIDEE
        for validation in validations
    ):
        return seance

    seance.membres_verrouilles = True
    seance.statut = SeanceOuverture.Statut.MEMBRES_CONFIRMES
    seance.save(update_fields=["membres_verrouilles", "statut", "updated_at"])
    return seance


@transaction.atomic
def soumettre_membres_a_valider(seance, user, commission_members: list) -> SeanceOuverture:
    if seance.secretaire_id != user.id:
        raise PermissionDenied({"detail": "Seul le secrétaire peut soumettre la commission."})

    if seance.membres_verrouilles:
        raise ValidationError({"detail": "La composition des membres est verrouillée."})

    if len(commission_members) < 3:
        raise ValidationError({"detail": "La commission doit comporter au moins 3 membres."})

    replace_members_from_commission(seance, commission_members)
    sent_count = _start_validation_workflow(seance)
    setattr(seance, "_emails_envoyes", sent_count)
    return seance


@transaction.atomic
def valider_composition(seance_id: int, user, commentaire: str = "") -> SeanceOuverture:
    role = get_user_composition_role(user)
    if not role:
        raise PermissionDenied({"detail": "Accès réservé aux validateurs CN/GP/RPM."})

    seance = (
        SeanceOuverture.objects.select_for_update()
        .filter(pk=seance_id)
        .prefetch_related("validations_composition")
        .first()
    )
    if not seance or seance.statut != SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
        raise ValidationError({"detail": "Cette séance n'est pas en validation de composition."})

    validation = _get_validation_for_role(seance, role)
    if not validation:
        raise PermissionDenied({"detail": "Validation non autorisée pour votre rôle."})

    if get_active_composition_role(seance) != role:
        raise PermissionDenied({"detail": "Votre validation n'est pas encore active."})

    if validation.decision != ValidationCompositionMembre.Decision.EN_ATTENTE:
        raise ValidationError({"detail": "Vous avez déjà traité cette composition."})

    validation.decision = ValidationCompositionMembre.Decision.VALIDEE
    validation.validateur = user
    validation.commentaire = commentaire
    validation.date_validation = timezone.now()
    validation.save(
        update_fields=[
            "decision",
            "validateur",
            "commentaire",
            "date_validation",
        ]
    )
    _clear_validation_prefetch_cache(seance)

    next_validation = _get_next_pending_validation(seance)
    if next_validation:
        _send_validation_for_role(next_validation)
        return seance

    return _finalize_composition_if_done(seance)


@transaction.atomic
def rejeter_composition(seance_id: int, user, commentaire: str = "") -> SeanceOuverture:
    role = get_user_composition_role(user)
    if not role:
        raise PermissionDenied({"detail": "Accès réservé aux validateurs CN/GP/RPM."})

    seance = (
        SeanceOuverture.objects.select_for_update()
        .filter(pk=seance_id)
        .prefetch_related("validations_composition")
        .first()
    )
    if not seance or seance.statut != SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
        raise ValidationError({"detail": "Cette séance n'est pas en validation de composition."})

    validation = _get_validation_for_role(seance, role)
    if not validation:
        raise PermissionDenied({"detail": "Validation non autorisée pour votre rôle."})

    if get_active_composition_role(seance) != role:
        raise PermissionDenied({"detail": "Votre validation n'est pas encore active."})

    if validation.decision != ValidationCompositionMembre.Decision.EN_ATTENTE:
        raise ValidationError({"detail": "Vous avez déjà traité cette composition."})

    validation.decision = ValidationCompositionMembre.Decision.REJETEE
    validation.validateur = user
    validation.commentaire = commentaire
    validation.date_validation = timezone.now()
    validation.save(
        update_fields=[
            "decision",
            "validateur",
            "commentaire",
            "date_validation",
        ]
    )
    _clear_validation_prefetch_cache(seance)

    return _finalize_composition_if_done(seance)
