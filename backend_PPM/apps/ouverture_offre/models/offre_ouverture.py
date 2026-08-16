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
    lot_numero = models.CharField(max_length=100, blank=True, default="")
    nif = models.CharField(max_length=100, blank=True, default="")
    stat = models.CharField(max_length=100, blank=True, default="")
    nif_stat = models.CharField(max_length=100, blank=True, default="")

    class EtatScelle(models.TextChoices):
        INTACT = "INTACT", "Intact"
        ALTERE = "ALTERE", "Altere"
        ABSENT = "ABSENT", "Absent"

    etat_scelle = models.CharField(
        max_length=20,
        choices=EtatScelle.choices,
        blank=True,
        default="",
    )
    presence_rature = models.BooleanField(default=False)
    description_rature = models.TextField(blank=True)
    document_substitution_present = models.BooleanField(default=False)
    consensus_technique_valide = models.BooleanField(default=False)
    eliminee_examen = models.BooleanField(default=False)

    class Meta:
        ordering = ["ordre_passage"]

    def save(self, *args, **kwargs):
        if self.nif or self.stat:
            parts = [p.strip() for p in [self.nif, self.stat] if p.strip()]
            self.nif_stat = " / ".join(parts)
        elif self.nif_stat and not (self.nif or self.stat):
            if "/" in self.nif_stat:
                parts = self.nif_stat.split("/", 1)
                self.nif = parts[0].strip()
                self.stat = parts[1].strip()
            else:
                self.nif = self.nif_stat.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.seance.reference_dossier} - {self.nom_soumissionnaire}"