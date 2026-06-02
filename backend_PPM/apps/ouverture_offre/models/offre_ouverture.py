from django.db import models

from .seance_ouverture import SeanceOuverture


class OffreOuverture(models.Model):
    class EtatEnveloppe(models.TextChoices):
        RECU = "RECU", "Reçu"
        INTEGRE = "INTEGRE", "Intègre"
        MANQUANT = "MANQUANT", "Manquant"
        MANQUANTE = "MANQUANTE", "Manquante"
        DEPOSEE = "DEPOSEE", "Déposée"

    seance = models.ForeignKey(
        SeanceOuverture,
        on_delete=models.CASCADE,
        related_name="offres",
    )
    ordre_passage = models.PositiveIntegerField()
    nom_soumissionnaire = models.CharField(max_length=255)
    pli_existe = models.BooleanField(default=True)
    motif_absence_pli = models.TextField(blank=True)
    date_reception_pli = models.DateField(null=True, blank=True)
    heure_reception_pli = models.TimeField(null=True, blank=True)
    enveloppe_administrative = models.CharField(
        max_length=20,
        choices=EtatEnveloppe.choices,
        blank=True,
        default="",
    )
    enveloppe_technique = models.CharField(
        max_length=20,
        choices=EtatEnveloppe.choices,
        blank=True,
        default="",
    )
    enveloppe_financiere = models.CharField(
        max_length=20,
        choices=EtatEnveloppe.choices,
        blank=True,
        default="",
    )
    montant_global = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        null=True,
        blank=True,
    )
    observations = models.TextField(blank=True)

    class Meta:
        ordering = ["ordre_passage"]

    def __str__(self):
        return f"{self.seance.reference_dossier} - {self.nom_soumissionnaire}"