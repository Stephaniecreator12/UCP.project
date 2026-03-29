from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.achats.models import DemandeAchat, ValidationDemande


def list_demandes_a_valider():
    return DemandeAchat.objects.filter(
        statut=DemandeAchat.STATUT_SOUMISE
    ).order_by("-submitted_at", "-created_at")


@transaction.atomic
def traiter_validation(demande, user, decision, commentaire=""):
    if demande.statut != DemandeAchat.STATUT_SOUMISE:
        raise ValidationError(
            {"detail": "Seule une demande soumise peut etre traitee."}
        )

    validation = ValidationDemande.objects.create(
        demande=demande,
        validateur=user,
        decision=decision,
        commentaire=commentaire,
    )

    if decision == ValidationDemande.DECISION_VALIDEE:
        demande.statut = DemandeAchat.STATUT_VALIDEE
    elif decision == ValidationDemande.DECISION_REJETEE:
        demande.statut = DemandeAchat.STATUT_REJETEE
    elif decision == ValidationDemande.DECISION_A_COMPLETER:
        demande.statut = DemandeAchat.STATUT_A_COMPLETER
    else:
        raise ValidationError({"decision": "Decision invalide."})

    demande.save(update_fields=["statut", "updated_at"])
    return validation
