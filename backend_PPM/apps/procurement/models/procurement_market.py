from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import FileExtensionValidator

from apps.common.models import ChoiceGroup, reference_choices


class ProcedureType(models.TextChoices):
    AOI = "AOI", "Appel d'offres international"
    AON = "AON", "Appel d'offres national"
    DC = "DC", "Demande de cotation"
    GRE_A_GRE = "GRE_A_GRE", "Gré à gré"


class CategoryType(models.TextChoices):
    BIENS = "BIENS", "Biens (matériels et équipements)"
    SERVICES = "SERVICES", "Services"
    INFRA = "INFRA", "Infrastructures (travaux)"


class PublicationStatus(models.TextChoices):
    PUBLISHED = "PUBLISHED", "Publié"
    CANCELLED = "CANCELLED", "Annulé"
    CLOSED = "CLOSED", "Clôturé"


class FinancingSource(models.TextChoices):
    FM = "FM", "Fonds Mondial"
    GAVI = "GAVI", "Alliance Gavi"
    BM = "BM", "Banque Mondiale"


def _procedure_type_choices():
    return reference_choices(ChoiceGroup.PROCEDURE_TYPE, ProcedureType.choices)


def _category_type_choices():
    return reference_choices(ChoiceGroup.CATEGORY_TYPE, CategoryType.choices)


def _publication_status_choices():
    return reference_choices(ChoiceGroup.PUBLICATION_STATUS, PublicationStatus.choices)


def _financing_source_choices():
    return reference_choices(ChoiceGroup.FINANCING_SOURCE, FinancingSource.choices)



class ProcurementMarket(models.Model):
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["status"]),
        ]
    reference_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False
    )

    title = models.CharField(max_length=200)

    procedure_type = models.CharField(
        max_length=20,
        choices=_procedure_type_choices
    )

    category = models.CharField(
        max_length=20,
        choices=_category_type_choices
    )

    financing_sources = models.JSONField(default=list)

    reference_bailleur = models.CharField(
        max_length=50,
        choices=_financing_source_choices,
        null=True,
        blank=True
    )

    project_code = models.CharField(max_length=100, blank=True, null=True)

    publication_date = models.DateTimeField()

    deadline = models.DateTimeField()

    submission_model = models.FileField(
        upload_to="submission_models/",
        validators=[
            FileExtensionValidator(["docx"])
        ],
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=_publication_status_choices,
        default=PublicationStatus.PUBLISHED
    )

    created_at = models.DateTimeField(auto_now_add=True)


    def save(self, *args, **kwargs):
        if not self.reference_number:
            self.reference_number = self.generate_reference()

        if self.status == PublicationStatus.PUBLISHED and not self.publication_date:
            self.publication_date = timezone.now()

        super().save(*args, **kwargs)

    def generate_reference(self):
        year = timezone.now().year
        last_id = ProcurementMarket.objects.count() + 1
        return f"UCP/DAO/{year}/{last_id:04d}"

    def clean(self):
        if self.publication_date and self.deadline:
            delta = self.deadline - self.publication_date

            if self.procedure_type == ProcedureType.AOI and delta.days < 15:
                raise ValidationError("AOI: délai minimum de 15 jours requis.")

            if self.procedure_type == ProcedureType.DC and delta.days < 10:
                raise ValidationError("DC: délai minimum de 10 jours requis.")

        if self.financing_sources.count() > 1 and not self.reference_bailleur:
            raise ValidationError("Un bailleur référent est obligatoire si plusieurs sources sont sélectionnées.")