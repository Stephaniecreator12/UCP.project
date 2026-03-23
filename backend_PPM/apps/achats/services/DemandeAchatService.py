from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.achats.models.demande_achat import DemandeAchat
from apps.achats.models.Workflow_history import WorkflowHistory
from apps.achats.permissions.achat_permissions import (
    ensure_can_edit_demande,
    ensure_can_submit_demande,
    ensure_can_transmit_demande,
)
from apps.achats.services.history_service import log_workflow

UPDATABLE_FIELDS = (
    "service_demandeur",
    "fonction_demandeur",
    "activite_ptba",
    "indicateur_performance",
    "source_financement",
    "ligne_budgetaire",
    "budget_estime",
    "devise",
    "type_marche",
    "nature_activite",
    "objet_demande",
    "description",
    "pieces_jointes",
    "region",
    "adresse_livraison",
    "date_debut",
    "date_fin",
    "urgent",
    "justification_urgence",
)

NUMERO_PREFIX = "UCP/DA"


def _build_numero_demande():
    year = timezone.now().year
    prefix = f"{NUMERO_PREFIX}/{year}/"

    last_demande = (
        DemandeAchat.objects.select_for_update()
        .filter(numero_demande__startswith=prefix)
        .order_by("-id")
        .first()
    )

    sequence = 1
    if last_demande:
        try:
            sequence = int(last_demande.numero_demande.split("/")[-1]) + 1
        except (ValueError, IndexError):
            sequence = last_demande.id + 1

    return f"{prefix}{sequence:04d}"


@transaction.atomic
def create_demande(validated_data, user):
    for _ in range(5):
        numero_demande = _build_numero_demande()
        try:
            demande = DemandeAchat.objects.create(
                numero_demande=numero_demande,
                demandeur=user,
                statut=DemandeAchat.STATUT_BROUILLON,
                **validated_data,
            )
            log_workflow(
                demande=demande,
                user=user,
                action=WorkflowHistory.ACTION_CREATE,
                new_status=demande.statut,
            )
            return demande
        except IntegrityError:
            continue

    raise ValidationError(
        {"numero_demande": "Impossible de générer un numéro de demande unique."}
    )


def list_user_demandes(user):
    return DemandeAchat.objects.filter(demandeur=user).order_by("-created_at")


@transaction.atomic
def update_demande(demande, validated_data, user):
    ensure_can_edit_demande(user, demande)

    for field in UPDATABLE_FIELDS:
        if field in validated_data:
            setattr(demande, field, validated_data[field])

    demande.save()
    return demande


@transaction.atomic
def submit_demande(demande, user):
    ensure_can_submit_demande(user, demande)

    old_status = demande.statut
    demande.statut = DemandeAchat.STATUT_SOUMISE
    demande.save()

    log_workflow(
        demande=demande,
        user=user,
        action=WorkflowHistory.ACTION_SUBMIT,
        old_status=old_status,
        new_status=demande.statut,
    )

    return demande


@transaction.atomic
def transmit_demande(demande, user):
    ensure_can_transmit_demande(user, demande)

    old_status = demande.statut
    demande.statut = DemandeAchat.STATUT_TRANSMISE_MARCHES
    demande.date_transmission_marches = timezone.now()
    demande.save()

    log_workflow(
        demande=demande,
        user=user,
        action=WorkflowHistory.ACTION_TRANSMIT,
        old_status=old_status,
        new_status=demande.statut,
    )

    return demande
