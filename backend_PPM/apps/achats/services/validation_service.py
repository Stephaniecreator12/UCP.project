from apps.achats.models.validation import ValidationDemande


def valider_demande(demande, user, statut, commentaire):

    validation = ValidationDemande.objects.create(
        demande=demande,
        validateur=user,
        statut=statut,
        commentaire=commentaire
    )

    return validation