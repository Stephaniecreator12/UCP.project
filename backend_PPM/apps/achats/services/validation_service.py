from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.achats.models import DemandeAchat, HistoriqueDemande, ValidationDemande
from apps.achats.services.history_service import create_history_entry
from apps.achats.services.notification_service import notify_validation_recorded

VALIDATION_FLOW = [
    DemandeAchat.ETAPE_HIERARCHIQUE,
    DemandeAchat.ETAPE_TECHNIQUE,
    DemandeAchat.ETAPE_BUDGETAIRE,
    DemandeAchat.ETAPE_PROGRAMMATIQUE,
    DemandeAchat.ETAPE_APPROBATION_FINALE,
]

GROUP_TO_STEP = {
    "VALIDATEUR_HIERARCHIQUE": DemandeAchat.ETAPE_HIERARCHIQUE,
    "VALIDATEUR_TECHNIQUE": DemandeAchat.ETAPE_TECHNIQUE,
    "VALIDATEUR_BUDGETAIRE": DemandeAchat.ETAPE_BUDGETAIRE,
    "VALIDATEUR_PROGRAMMATIQUE": DemandeAchat.ETAPE_PROGRAMMATIQUE,
    "APPROBATEUR_NATIONAL": DemandeAchat.ETAPE_APPROBATION_FINALE,
}

def get_user_validation_step(user):
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

    return DemandeAchat.objects.filter(
        statut=DemandeAchat.STATUT_SOUMISE,
        etape_validation_actuelle=user_step,
    ).prefetch_related(
        "lignes_besoin",
        "documents",
        "validations__validateur",
        "historiques__user",
    ).order_by("-submitted_at", "-created_at")


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

    if decision in [
        ValidationDemande.DECISION_DEFAVORABLE,
        ValidationDemande.DECISION_REJETEE,
    ]:
        demande.statut = DemandeAchat.STATUT_REJETEE

    elif decision in [
        ValidationDemande.DECISION_A_COMPLETER,
        ValidationDemande.DECISION_A_REVOIR,
    ]:
        demande.statut = DemandeAchat.STATUT_A_COMPLETER

    elif decision in [
        ValidationDemande.DECISION_FAVORABLE,
        ValidationDemande.DECISION_APPROUVEE,
    ]:
        if demande.etape_validation_actuelle == DemandeAchat.ETAPE_BUDGETAIRE:
            ligne_engagement = donnees_etape.get("ligne_engagement")
            if ligne_engagement:
                demande.numero_engagement_budgetaire = str(ligne_engagement)

            solde_apres_engagement = donnees_etape.get("solde_apres_engagement")
            if solde_apres_engagement not in [None, ""]:
                demande.solde_apres_engagement = solde_apres_engagement

        next_step = get_next_step(demande.etape_validation_actuelle)

        if next_step == DemandeAchat.ETAPE_TERMINEE:
            demande.statut = DemandeAchat.STATUT_VALIDEE
            demande.etape_validation_actuelle = DemandeAchat.ETAPE_TERMINEE
        else:
            demande.etape_validation_actuelle = next_step
            demande.statut = DemandeAchat.STATUT_SOUMISE
    else:
        raise ValidationError({"decision": "Decision invalide."})

    demande.save(
        update_fields=[
            "statut",
            "etape_validation_actuelle",
            "numero_engagement_budgetaire",
            "solde_apres_engagement",
            "updated_at",
        ]
    )

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
