from apps.achats.models.demande_achat import DemandeAchat


def create_demande(data):

    demande = DemandeAchat.objects.create(**data)

    return demande


def list_demandes():

    return list(DemandeAchat.objects.values())


def get_demande(id):

    return DemandeAchat.objects.get(id=id)