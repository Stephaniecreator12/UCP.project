# contracts/models.py

import uuid

from django.db import models

from apps.contrats.models.enums import ContratStatut


class Contrat(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    numero_marche = models.CharField(
        max_length=100,
        unique=True
    )

    projet = models.CharField(max_length=100, blank=True, null=True)

    prestataire_id = models.BigIntegerField(
        db_index=True
    )

    montant_ttc = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    date_signature = models.DateField()

    duree_execution = models.DurationField()

    clauses_particulieres = models.TextField(
        blank=True
    )

    # Version JSON demandée dans le cahier des charges
    echeancier = models.JSONField(
        default=list,
        blank=True
    )

    statut = models.CharField(
        max_length=30,
        choices=ContratStatut.choices,
        default=ContratStatut.BROUILLON
    )

    # Signataire réel du contrat
    representant_signataire = models.CharField(
        max_length=255,
        blank=True
    )

    fonction_signataire = models.CharField(
        max_length=255,
        blank=True
    )

    date_creation = models.DateTimeField(auto_now_add=True)

    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "contrats"
        ordering = ["-date_creation"]

    def __str__(self):
        return self.numero_marche