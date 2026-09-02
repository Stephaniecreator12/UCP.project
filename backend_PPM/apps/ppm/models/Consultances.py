from django.db import models
from django.core.exceptions import ValidationError

class FinancingSource(models.TextChoices):
    FM = "FM", "Fonds Mondial"
    GAVI = "GAVI", "Alliance Gavi"
    BM = "BM", "Banque Mondiale"


class Consultance(models.Model):
    id = models.AutoField(primary_key=True)
    ref_code_suivi = models.CharField(max_length=100, null=True, blank=True)
    intitule = models.CharField(max_length=255)
    agmoxdirection = models.CharField(max_length=255, null=True, blank=True)
    montant_estimatif = models.DecimalField(max_digits=15, decimal_places=2)
    methode = models.CharField(max_length=255)
    approche = models.CharField(max_length=255)
    revue = models.CharField(max_length=255)
    forfaitxtemps = models.CharField(max_length=255, null=True, blank=True)
    commentaire = models.TextField(null=True, blank=True)
    statut = models.CharField(max_length=255, null=True, blank=True)

    financing_sources = models.JSONField(default=list, blank=True)
    reference_bailleur = models.CharField(
        max_length=50,
        choices=FinancingSource.choices,
        null=True,
        blank=True,
    )
    project_code = models.CharField(max_length=100, blank=True, null=True)

    # --- DATES PREVUES ---
    TdR_prevu = models.DateField(null=True, blank=True)
    ami_prevu = models.DateField(null=True, blank=True)
    liste_restreinte_prevu = models.DateField(null=True, blank=True)
    demande_proposition_prevu = models.DateField(null=True, blank=True)
    date_invitation_prevu = models.DateField(null=True, blank=True)
    date_ouverture_prevu = models.DateField(null=True, blank=True)
    rapport_evaluation_prevu = models.DateField(null=True, blank=True)
    ouverture_plis_prevu = models.DateField(null=True, blank=True)
    projet_contrat_prevu = models.DateField(null=True, blank=True)
    date_signature_prevu = models.DateField(null=True, blank=True)
    date_fin_prevu = models.DateField(null=True, blank=True)
    duree = models.IntegerField(default=60)

    # --- DATES REELLES ---
    TdR_reel = models.DateField(null=True, blank=True)
    ami_reel = models.DateField(null=True, blank=True)
    liste_restreinte_reel = models.DateField(null=True, blank=True)
    demande_proposition_reel = models.DateField(null=True, blank=True)
    date_invitation_reel = models.DateField(null=True, blank=True)
    date_ouverture_reel = models.DateField(null=True, blank=True)
    rapport_evaluation_reel = models.DateField(null=True, blank=True)
    ouverture_plis_reel = models.DateField(null=True, blank=True)
    projet_contrat_reel = models.DateField(null=True, blank=True)
    date_signature_reel = models.DateField(null=True, blank=True)
    date_fin_reel = models.DateField(null=True, blank=True)

    def clean(self):
        super().clean()
        errors = {}
        if self.financing_sources and len(self.financing_sources) > 1 and not self.reference_bailleur:
            errors["reference_bailleur"] = "Un bailleur référent est obligatoire si plusieurs sources sont sélectionnées."
        if self.reference_bailleur and self.financing_sources and self.reference_bailleur not in self.financing_sources:
            errors["reference_bailleur"] = "Le bailleur référent doit faire partie des sources sélectionnées."
        if self.financing_sources and not self.project_code:
            errors["project_code"] = "Le code projet est obligatoire lorsque des sources de financement sont renseignées."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ref_code_suivi or ''} — {self.intitule}" if self.ref_code_suivi else self.intitule

    class Meta:
        db_table = "consultance"
        verbose_name = "Consultance"
        verbose_name_plural = "Consultances"
