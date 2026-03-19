#Responsable de :créer une demande;lister les demandesrécupérer une demande;soumettre une demande

from apps.achats.models.demande_achat import DemandeAchat


def create_demande(data, user):

    demande = DemandeAchat.objects.create(
        **data,
        demandeur=user,
        statut="BROUILLON"
    )

    return demande


def list_demandes():

    return DemandeAchat.objects.all()


def get_demande(demande_id):

    return DemandeAchat.objects.get(id=demande_id)


def soumettre_demande(demande):

    demande.statut = "SOUMISE"

    demande.save()

    return demande