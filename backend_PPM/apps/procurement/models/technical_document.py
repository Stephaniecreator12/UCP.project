from django.core.validators import FileExtensionValidator
from django.db import models
from apps.procurement.models.procurement_market import ProcurementMarket
class TechnicalDocument(models.Model):
    class Meta:
        unique_together = ("market", "version")
    market = models.ForeignKey(
        ProcurementMarket,
        on_delete=models.CASCADE,
        related_name="technical_documents"
    )

    file = models.FileField(
        upload_to="technical_documents/",
        validators=[
            FileExtensionValidator(["pdf"])
        ]
    )

    version = models.PositiveIntegerField(
        editable=False
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )
    def save(self, *args, **kwargs):

        if not self.version:
            last_version = TechnicalDocument.objects.filter(
                market=self.market
            ).order_by("-version").first()

            if last_version:
                self.version = last_version.version + 1
            else:
                self.version = 1

        super().save(*args, **kwargs)