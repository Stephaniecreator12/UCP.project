from decimal import Decimal, InvalidOperation

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.achats.models import DemandeAchat, HistoriqueDemande, ValidationDemande
from apps.achats.services.history_service import create_history_entry
from apps.achats.services.notification_service import notify_validation_recorded
from apps.achats.services.demande_service import (
    _build_numero_subvention,
    _build_numero_engagement_budgetaire,
)

VALIDATION_FLOW = [
    DemandeAchat.ETAPE_HIERARCHIQUE,
    DemandeAchat.ETAPE_TECHNIQUE,
    DemandeAchat.ETAPE_BUDGETAIRE,
    DemandeAchat.ETAPE_PROGRAMMATIQUE,
    DemandeAchat.ETAPE_APPROBATION_FINALE,
]

# Maps Django groups to the business step they are allowed to validate.
# This is the main bridge between authentication data and the achats workflow.
GROUP_TO_STEP = {
    "VALIDATEUR_HIERARCHIQUE": DemandeAchat.ETAPE_HIERARCHIQUE,
    "VALIDATEUR_TECHNIQUE": DemandeAchat.ETAPE_TECHNIQUE,
    "FINANCE": DemandeAchat.ETAPE_BUDGETAIRE,
    "RAF": DemandeAchat.ETAPE_BUDGETAIRE,
    "VALIDATEUR_BUDGETAIRE": DemandeAchat.ETAPE_BUDGETAIRE,
    "VALIDATEUR_PROGRAMMATIQUE": DemandeAchat.ETAPE_PROGRAMMATIQUE,
    "APPROBATEUR_NATIONAL": DemandeAchat.ETAPE_APPROBATION_FINALE,
}

RETURN_FOR_CORRECTION_DECISIONS = {
    ValidationDemande.DECISION_DEFAVORABLE,
    ValidationDemande.DECISION_REJETEE,
    ValidationDemande.DECISION_A_COMPLETER,
    ValidationDemande.DECISION_A_REVOIR,
}


def _parse_budget_amount(value):
    if value in (None, ""):
        raise ValidationError(
            {"donnees_etape": {"solde_disponible_ligne_budgetaire": "Le solde avant est obligatoire."}}
        )

    normalized = str(value).replace(" ", "").replace(",", ".").strip()

    try:
        return Decimal(normalized)
    except (InvalidOperation, ValueError):
        raise ValidationError(
            {
                "donnees_etape": {
                    "solde_disponible_ligne_budgetaire": "Le solde avant doit etre un nombre valide."
                }
            }
        )


def _apply_budget_step_data(demande, donnees_etape):
    ligne_budgetaire = (donnees_etape.get("ligne_budgetaire") or "").strip()
    source_financement = (donnees_etape.get("source_financement") or "").strip()
    disponibilite_budgetaire = (donnees_etape.get("disponibilite_budgetaire") or "").strip()

    if not ligne_budgetaire:
        raise ValidationError(
            {"donnees_etape": {"ligne_budgetaire": "La ligne budgetaire est obligatoire."}}
        )

    if not source_financement:
        raise ValidationError(
            {"donnees_etape": {"source_financement": "La source de financement est obligatoire."}}
        )

    solde_disponible = _parse_budget_amount(
        donnees_etape.get("solde_disponible_ligne_budgetaire")
    )
    cout_estime = Decimal(demande.cout_total_estime or 0)
    solde_apres_engagement = solde_disponible - cout_estime

    if disponibilite_budgetaire == "NON_DISPONIBLE" or solde_apres_engagement < 0:
        raise ValidationError(
            {
                "decision": (
                    "Un avis favorable n'est pas possible tant que la disponibilite budgetaire "
                    "est insuffisante."
                )
            }
        )

    engagement = (donnees_etape.get("numero_engagement_budgetaire") or "").strip()

    demande.ligne_budgetaire = ligne_budgetaire
    demande.source_financement = source_financement
    demande.numero_subvention = (
        (donnees_etape.get("numero_subvention") or "").strip()
        or _build_numero_subvention(source_financement)
    )
    demande.solde_disponible_ligne_budgetaire = solde_disponible
    demande.solde_apres_engagement = solde_apres_engagement
    if not demande.numero_engagement_budgetaire:
        demande.numero_engagement_budgetaire = engagement or _build_numero_engagement_budgetaire()

    return {
        "ligne_budgetaire",
        "source_financement",
        "numero_subvention",
        "solde_disponible_ligne_budgetaire",
        "solde_apres_engagement",
        "numero_engagement_budgetaire",
    }

def get_user_validation_step(user):
    # A user may belong to several groups; the first matching workflow group
    # determines the queue used by this module.
    user_group_names = set(user.groups.values_list("name", flat=True))

    for group_name, step in GROUP_TO_STEP.items():
        if group_name in user_group_names:
            return step

    return None


def get_next_step(current_step):
    try:
        index = VALIDATION_FLOW.index(current_step)
    except ValueError:
        return DemandeAchat.ETAPE_TERMINEE

    if index + 1 < len(VALIDATION_FLOW):
        return VALIDATION_FLOW[index + 1]

    return DemandeAchat.ETAPE_TERMINEE


def list_demandes_a_valider(user):
    user_step = get_user_validation_step(user)

    if not user_step:
        return DemandeAchat.objects.none()

    from django.db.models import Prefetch

    return (
        DemandeAchat.objects.filter(
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=user_step,
        )
        .select_related("demandeur", "tdr_st_document")
        .prefetch_related(
            "demandeur__groups",
            "lignes_besoin",
            "documents",
            Prefetch(
                "validations",
                queryset=ValidationDemande.objects.select_related("validateur"),
            ),
            Prefetch(
                "historiques",
                queryset=HistoriqueDemande.objects.select_related("user"),
            ),
        )
        .order_by("-submitted_at", "-created_at")
    )


@transaction.atomic
def traiter_validation(demande, user, decision, commentaire="", donnees_etape=None):
    user_step = get_user_validation_step(user)

    if not user_step:
        raise ValidationError(
            {"detail": "Cet utilisateur n'est associe a aucune etape de validation."}
        )

    if demande.etape_validation_actuelle != user_step:
        raise ValidationError(
            {"detail": "Cette demande n'est pas a votre etape de validation."}
        )

    if demande.statut != DemandeAchat.STATUT_SOUMISE:
        raise ValidationError(
            {"detail": "Seule une demande soumise peut etre traitee."}
        )

    donnees_etape = donnees_etape or {}

    validation = ValidationDemande.objects.create(
        demande=demande,
        validateur=user,
        etape=demande.etape_validation_actuelle,
        decision=decision,
        commentaire=commentaire,
        donnees_etape=donnees_etape,
    )

    # The request status changes first, then the next owner step is computed.
    # This keeps the workflow state readable from the DemandeAchat row itself.
    update_fields = {"statut", "etape_validation_actuelle", "updated_at"}

    if decision in RETURN_FOR_CORRECTION_DECISIONS:
        demande.statut = DemandeAchat.STATUT_A_COMPLETER

    elif decision in [
        ValidationDemande.DECISION_FAVORABLE,
        ValidationDemande.DECISION_APPROUVEE,
    ]:
        if user_step == DemandeAchat.ETAPE_BUDGETAIRE:
            update_fields.update(_apply_budget_step_data(demande, donnees_etape))

        next_step = get_next_step(demande.etape_validation_actuelle)

        if next_step == DemandeAchat.ETAPE_TERMINEE:
            if not (
                demande.ligne_budgetaire
                and demande.source_financement
                and demande.numero_engagement_budgetaire
            ):
                budget_validation = (
                    demande.validations.filter(etape=DemandeAchat.ETAPE_BUDGETAIRE)
                    .order_by("-created_at")
                    .first()
                )

                if budget_validation and isinstance(budget_validation.donnees_etape, dict):
                    update_fields.update(
                        _apply_budget_step_data(demande, budget_validation.donnees_etape)
                    )

            if not (
                demande.ligne_budgetaire
                and demande.source_financement
                and demande.numero_engagement_budgetaire
            ):
                raise ValidationError(
                    {
                        "detail": (
                            "La validation budgetaire doit etre complete avant "
                            "l'approbation finale."
                        )
                    }
                )

            demande.statut = DemandeAchat.STATUT_VALIDEE_BUDGETAIRE
            demande.etape_validation_actuelle = DemandeAchat.ETAPE_TERMINEE
        else:
            demande.etape_validation_actuelle = next_step
            demande.statut = DemandeAchat.STATUT_SOUMISE
    else:
        raise ValidationError({"decision": "Decision invalide."})

    demande.save(update_fields=sorted(update_fields))

    create_history_entry(
        demande=demande,
        action=HistoriqueDemande.ACTION_VALIDATION,
        user=user,
        description="Une décision de validation a été enregistrée.",
        metadata={
            "etape": validation.etape,
            "decision": validation.decision,
            "statut": demande.statut,
            "etape_validation_actuelle": demande.etape_validation_actuelle,
        },
    )
    notify_validation_recorded(demande, validation)
    return validation
