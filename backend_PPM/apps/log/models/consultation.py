from django.db import models
from apps.procurement.models.procurement_market import ProcurementMarket
class LogConsultation(models.Model):
    dossier = models.ForeignKey(ProcurementMarket, on_delete=models.CASCADE, related_name="logs_vues", db_index=True)
    user_id = models.BigIntegerField(db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Log de Consultation"
