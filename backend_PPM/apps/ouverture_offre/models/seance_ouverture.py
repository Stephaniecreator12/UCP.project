from django.conf import settings
from django.db import models

from apps.common.models import ChoiceGroup, reference_choices
from apps.procurement.models.procurement_market import CategoryType


class SeanceOuverture(models.Model):
    class Statut(models.TextChoices):
        BROUILLON = "BROUILLON", "Brouillon"
        EN_SAISIE = "EN_SAISIE", "En saisie"
        EN_VALIDATION_MEMBRES = "EN_VALIDATION_MEMBRES", "En validation membres"
        EN_VALIDATION_PRESIDENT = "EN_VALIDATION_PRESIDENT", "En validation president"
        VALIDEE = "VALIDEE", "Validee"
        REJETEE = "REJETEE", "Rejetee"

    class Decision(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        VALIDEE = "VALIDEE", "Validee"
        REJETEE = "REJETEE", "Rejetee"
        REPORTEE = "REPORTEE", "Reportee"

    reference_dossier = models.CharField(max_length=100)
    objet_dossier = models.CharField(max_length=255, blank=True)

    category_type = models.CharField(
        max_length=20,
        choices=CategoryType.choices,
        blank=True,
        default="",
        db_index=True,
        help_text="Catégorie d'achat du dossier (BIENS / SERVICES / INFRA). "
                  "Résolu automatiquement ou saisi manuellement.",
    )
    date_seance = models.DateField(null=True, blank=True)
    heure_seance = models.TimeField(null=True, blank=True)
    lieu = models.CharField(max_length=255, blank=True)
    observations = models.TextField(blank=True)

    secretaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="seances_creees_ouverture",
    )
    president = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="seances_presidees_ouverture",
        null=True,
        blank=True,
    )

    statut = models.CharField(
        max_length=32,
        choices=Statut.choices,
        default=Statut.BROUILLON,
        db_index=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    president_a_valide = models.BooleanField(default=False)
    president_decision = models.CharField(
        max_length=20,
        choices=Decision.choices,
        default=Decision.EN_ATTENTE,
    )
    president_commentaire = models.TextField(blank=True)
    date_validation_president = models.DateTimeField(null=True, blank=True)
    president_ip_adresse = models.GenericIPAddressField(null=True, blank=True)
    president_navigateur = models.CharField(max_length=255, blank=True)
    president_validation_password_hash = models.CharField(max_length=255, blank=True)
    president_validation_password_generated_at = models.DateTimeField(null=True, blank=True)
    president_validation_password_consumed_at = models.DateTimeField(null=True, blank=True)


    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference_dossier} - {self.statut}"

    def save(self, *args, **kwargs):
        if not self.category_type:
            self.category_type = self._resoudre_category()
        super().save(*args, **kwargs)

    def _resoudre_category(self):
        """Résout la catégorie d'achat depuis le ProcurementMarket lié."""
        from apps.procurement.models.procurement_market import ProcurementMarket
        market = ProcurementMarket.objects.filter(
            reference_number=self.reference_dossier,
        ).first()
        return market.category if market else ""

    class EtapeOuverture(models.TextChoices):
        COMPLETE = "COMPLETE", "Ouverture complete"
        ADMIN_TECH = "ADMIN_TECH", "Ouverture administrative et technique"

    class EtatScelle(models.TextChoices):
        INTACT = "INTACT", "Intact"
        ALTERE = "ALTERE", "Altere"
        ABSENT = "ABSENT", "Absent"

    etape_ouverture = models.CharField(
        max_length=20,
        choices=EtapeOuverture.choices,
        default=EtapeOuverture.COMPLETE,
    )
    etat_scelle = models.CharField(
        max_length=20,
        choices=EtatScelle.choices,
        blank=True,
        default="",
    )
    presence_rature = models.BooleanField(default=False)
    description_rature = models.TextField(blank=True)
    document_substitution_present = models.BooleanField(default=False)
