from django.db import models
from .evaluation_offre import DecisionFinale


class EvaluationReport(models.Model):
    decision = models.OneToOneField(
        DecisionFinale,
        on_delete=models.CASCADE,
        related_name="report",
    )
    fichier = models.FileField(upload_to="evaluation_reports/")
    version = models.IntegerField(default=1)
    hash_document = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Rapport evaluation - {self.decision.offre.seance.reference_dossier} (v{self.version})"
