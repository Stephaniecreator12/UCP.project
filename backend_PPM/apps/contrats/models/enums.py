# contracts/enums.py

from django.db import models

class ContratStatut(models.TextChoices):
    BROUILLON = "BROUILLON", "Brouillon"
    ATTENTE_SIGNATURE = "ATTENTE_SIGNATURE", "En attente de signature"
    EXECUTION = "EXECUTION", "En exécution"
    TERMINE = "TERMINE", "Terminé"


class TypeDocumentContrat(models.TextChoices):
    CONTRAT_SIGNE = "CONTRAT_SIGNE", "Contrat signé"
    AVENANT = "AVENANT", "Avenant"