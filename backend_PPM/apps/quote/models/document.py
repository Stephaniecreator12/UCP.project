class DocumentType(models.TextChoices):
    TECHNICAL = "TECHNICAL", "Dossier technique"
    ANNEX = "ANNEX", "Annexes"
    SUBMISSION = "SUBMISSION", "Modèle de soumission"


def market_file_path(instance, filename):
    return f"markets/{instance.market.reference_number}/{filename}"


class MarketDocument(models.Model):
    market = models.ForeignKey(
        ProcurementMarket,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    doc_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices
    )

    file = models.FileField(upload_to=market_file_path)

    version = models.PositiveIntegerField(default=1)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.doc_type == DocumentType.TECHNICAL:
            last_version = MarketDocument.objects.filter(
                market=self.market,
                doc_type=DocumentType.TECHNICAL
            ).count()
            self.version = last_version + 1

        super().save(*args, **kwargs)

    def clean(self):
        if self.doc_type == DocumentType.ANNEX:
            count = MarketDocument.objects.filter(
                market=self.market,
                doc_type=DocumentType.ANNEX
            ).count()

            if count >= 5:
                raise ValidationError("Maximum 5 annexes autorisées.")