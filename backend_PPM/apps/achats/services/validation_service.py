from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError

from apps.achats.models.demande_achat import DemandeAchat
from apps.achats.models.validation import ValidationDemande
from apps.achats.models.Workflow_history import WorkflowHistory
from apps.achats.permissions.achat_permissions import (
    ensure_can_validate_demande,
    get_pending_status_for_user,
)
from apps.achats.services.history_service import log_workflow
from apps.achats.services.workflow_service import get_next_status, get_validation_role


def list_pending_demandes(user):
    statut = get_pending_status_for_user(user)
    if statut is None:
        return DemandeAchat.objects.none()

    return DemandeAchat.objects.filter(statut=statut).order_by("-created_at")


@transaction.atomic
def valider_demande(
    demande,
    user,
    decision,
    commentaire="",
    fonds_statut=None,
    visa="",
):
    ensure_can_validate_demande(user, demande)

    if decision not in {
        ValidationDemande.STATUT_APPROUVE,
        ValidationDemande.STATUT_REJETE,
    }:
        raise ValidationError({"decision": "Décision invalide."})

    current_role = get_validation_role(demande.statut)
    if current_role is None:
        raise ValidationError({"statut": "Aucune validation possible pour ce statut."})

    if (
        current_role == ValidationDemande.ROLE_BUDGET
        and decision == ValidationDemande.STATUT_APPROUVE
        and not fonds_statut
    ):
        raise ValidationError(
            {"fonds_statut": "Ce champ est obligatoire pour une validation budget."}
        )

    old_status = demande.statut

    try:
        validation = ValidationDemande.objects.create(
            demande=demande,
            validateur=user,
            role=current_role,
            statut=decision,
            commentaire=commentaire,
            fonds_statut=fonds_statut,
            visa=visa or "",
        )
    except IntegrityError:
        raise ValidationError({"demande": "Cette étape a déjà été validée."})

    demande.statut = get_next_status(demande.statut, decision)
    demande.save()

    action = (
        WorkflowHistory.ACTION_APPROVE
        if decision == ValidationDemande.STATUT_APPROUVE
        else WorkflowHistory.ACTION_REJECT
    )

    log_workflow(
        demande=demande,
        user=user,
        action=action,
        old_status=old_status,
        new_status=demande.statut,
        commentaire=commentaire,
    )

    return validation
