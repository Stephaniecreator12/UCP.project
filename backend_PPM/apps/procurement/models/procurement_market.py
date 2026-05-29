from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import FileExtensionValidator


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
    GLOBAL_FUND = "GLOBAL_FUND", "Fonds Mondial"
    GAVI = "GAVI", "Alliance Gavi"
    WORLD_BANK = "WORLD_BANK", "Banque Mondiale"



class ProcurementMarket(models.Model):
    reference_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False
    )

    title = models.CharField(max_length=200)

    procedure_type = models.CharField(
        max_length=20,
        choices=ProcedureType.choices
    )

    category = models.CharField(
        max_length=20,
        choices=CategoryType.choices
    )

    financing_sources = models.JSONField(default=list)

    reference_bailleur = models.CharField(
        max_length=50,
        choices=FinancingSource.choices,
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
        choices=PublicationStatus.choices,
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

        if len(self.financing_sources or []) > 1 and not self.reference_bailleur:
            raise ValidationError("Un bailleur référent est obligatoire si plusieurs sources sont sélectionnées.")
