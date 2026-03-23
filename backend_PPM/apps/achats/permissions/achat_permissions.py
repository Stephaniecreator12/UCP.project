from rest_framework.exceptions import PermissionDenied

from apps.achats.models.demande_achat import DemandeAchat
from apps.achats.services.workflow_service import get_validation_role

ROLE_DEMANDEUR = "DEMANDEUR"
ROLE_SERVICE = "SERVICE"
ROLE_BUDGET = "BUDGET"
ROLE_DIRECTION = "DIRECTION"
ROLE_MARCHES = "MARCHES"

ROLE_PRIORITY = (
    ROLE_DEMANDEUR,
    ROLE_SERVICE,
    ROLE_BUDGET,
    ROLE_DIRECTION,
    ROLE_MARCHES,
)

PENDING_STATUS_BY_ROLE = {
    ROLE_SERVICE: DemandeAchat.STATUT_SOUMISE,
    ROLE_BUDGET: DemandeAchat.STATUT_VALIDE_SERVICE,
    ROLE_DIRECTION: DemandeAchat.STATUT_VALIDE_BUDGET,
    ROLE_MARCHES: DemandeAchat.STATUT_VALIDE_DIRECTION,
}


def get_user_role(user):
    if not user or not user.is_authenticated:
        return None

    direct_role = getattr(user, "role", None)
    if direct_role:
        return str(direct_role).upper()

    group_names = {name.upper() for name in user.groups.values_list("name", flat=True)}
    for role in ROLE_PRIORITY:
        if role in group_names:
            return role

    return None


def get_pending_status_for_user(user):
    role = get_user_role(user)
    return PENDING_STATUS_BY_ROLE.get(role)


def ensure_can_view_demande(user, demande):
    if user.is_superuser or user.is_staff:
        return

    role = get_user_role(user)

    if demande.demandeur_id == user.id:
        return

    if role == get_validation_role(demande.statut):
        return

    if demande.validations.filter(validateur=user).exists():
        return

    if role == ROLE_MARCHES and demande.statut in {
        DemandeAchat.STATUT_VALIDE_DIRECTION,
        DemandeAchat.STATUT_TRANSMISE_MARCHES,
    }:
        return

    raise PermissionDenied("Vous n'êtes pas autorisé à consulter cette demande.")


def ensure_can_edit_demande(user, demande):
    if demande.demandeur_id != user.id:
        raise PermissionDenied("Seul le demandeur peut modifier cette demande.")

    if demande.statut != DemandeAchat.STATUT_BROUILLON:
        raise PermissionDenied("Seul un brouillon peut être modifié.")


def ensure_can_submit_demande(user, demande):
    if demande.demandeur_id != user.id:
        raise PermissionDenied("Seul le demandeur peut soumettre cette demande.")

    if demande.statut != DemandeAchat.STATUT_BROUILLON:
        raise PermissionDenied("Cette demande a déjà été soumise.")


def ensure_can_validate_demande(user, demande):
    role = get_user_role(user)
    required_role = get_validation_role(demande.statut)

    if required_role is None:
        raise PermissionDenied("Cette demande n'est pas dans une étape de validation.")

    if role != required_role:
        raise PermissionDenied("Vous n'êtes pas autorisé à valider cette étape.")


def ensure_can_transmit_demande(user, demande):
    role = get_user_role(user)

    if demande.statut != DemandeAchat.STATUT_VALIDE_DIRECTION:
        raise PermissionDenied("Seule une demande validée direction peut être transmise.")

    if role not in {ROLE_DIRECTION, ROLE_MARCHES}:
        raise PermissionDenied("Vous n'êtes pas autorisé à transmettre cette demande.")
