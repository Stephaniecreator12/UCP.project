from django.db import models
from apps.contrats.models.contrats import Contrat

class EcheancePaiement(models.Model):

    contrat = models.ForeignKey(
        Contrat,
        on_delete=models.CASCADE,
        related_name="echeances"
    )

    ordre = models.PositiveIntegerField()

    libelle = models.CharField(
        max_length=255
    )

    montant = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    pourcentage = models.DecimalField(
        max_digits=5,
        decimal_places=2
    )

    date_prevue = models.DateField(
        null=True,
        blank=True
    )

    condition = models.TextField(
        blank=True
    )

    class Meta:
        db_table = "contrat_echeances"
        ordering = ["ordre"]