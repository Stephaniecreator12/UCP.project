from django.conf import settings
from django.db import models
from apps.contrats.models.contrats import Contrat

class ContratAuditLog(models.Model):

    contrat = models.ForeignKey(
        Contrat,
        on_delete=models.CASCADE,
        related_name="audit_logs"
    )

    utilisateur_id = models.BigIntegerField(
        db_index=True
    )
    action = models.CharField(
        max_length=100
    )

    details = models.JSONField(
        default=dict
    )

    date_action = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "contrat_audit_log"
        ordering = ["-date_action"]