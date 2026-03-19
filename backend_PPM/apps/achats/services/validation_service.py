#enregistrer une validation;appeler le workflow

from apps.achats.models.validation import ValidationDemande
from apps.achats.services.workflow_service import get_next_status


def get_validation_role(current_status):

    mapping = {
        "SOUMISE": "SERVICE",
        "VALIDE_SERVICE": "BUDGET",
        "VALIDE_BUDGET": "DIRECTION",
    }

    return mapping.get(current_status)


def valider_demande(demande, user, decision, commentaire):

    validation = ValidationDemande.objects.create(
        demande=demande,
        validateur=user,
        role=get_validation_role(demande.statut),
        statut=decision,
        commentaire=commentaire
    )

    new_status = get_next_status(demande.statut, decision)

    demande.statut = new_status
    demande.save()

    return validation
