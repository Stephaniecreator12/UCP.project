from django.core.validators import FileExtensionValidator
from django.db import models
from apps.procurement.models.procurement_market import ProcurementMarket
from django.core.exceptions import ValidationError

class AnnexDocument(models.Model):

    market = models.ForeignKey(
        ProcurementMarket,
        on_delete=models.CASCADE,
        related_name="annexes"
    )

    file = models.FileField()

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    def clean(self):

        if self.market.annexes.count() >= 5:
            raise ValidationError(
                "Maximum 5 annexes."
            )