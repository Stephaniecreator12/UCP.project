from rest_framework.exceptions import ValidationError

from apps.achats.models.demande_achat import DemandeAchat
from apps.achats.models.validation import ValidationDemande

VALIDATION_ROLE_BY_STATUS = {
    DemandeAchat.STATUT_SOUMISE: ValidationDemande.ROLE_SERVICE,
    DemandeAchat.STATUT_VALIDE_SERVICE: ValidationDemande.ROLE_BUDGET,
    DemandeAchat.STATUT_VALIDE_BUDGET: ValidationDemande.ROLE_DIRECTION,
}

APPROVAL_WORKFLOW = {
    DemandeAchat.STATUT_SOUMISE: DemandeAchat.STATUT_VALIDE_SERVICE,
    DemandeAchat.STATUT_VALIDE_SERVICE: DemandeAchat.STATUT_VALIDE_BUDGET,
    DemandeAchat.STATUT_VALIDE_BUDGET: DemandeAchat.STATUT_VALIDE_DIRECTION,
}


def get_validation_role(current_status):
    return VALIDATION_ROLE_BY_STATUS.get(current_status)


def get_next_status(current_status, decision):
    if decision == ValidationDemande.STATUT_REJETE:
        return DemandeAchat.STATUT_REJETEE

    if decision != ValidationDemande.STATUT_APPROUVE:
        raise ValidationError({"decision": "Décision de validation invalide."})

    next_status = APPROVAL_WORKFLOW.get(current_status)
    if next_status is None:
        raise ValidationError(
            {"statut": "Aucune transition de validation possible pour ce statut."}
        )

    return next_status
