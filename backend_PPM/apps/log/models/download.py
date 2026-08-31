from django.db import models
from apps.procurement.models.procurement_market import ProcurementMarket
from apps.common.models import ChoiceGroup, reference_choices


def _type_log_document_choices():
    return reference_choices(ChoiceGroup.TYPE_LOG_DOCUMENT, LogDownload.TYPE_CHOICES)


class LogDownload(models.Model):
    TYPE_CHOICES = [
        ('DAO', 'DAO Principal'),
        ('ANNEXE', 'Fichier Annexe'),
    ]
    
    dossier = models.ForeignKey(ProcurementMarket, on_delete=models.CASCADE, related_name="logs_telechargements", db_index=True)
    
    user_id = models.BigIntegerField(db_index=True)
    
    doc_type = models.CharField(max_length=10, choices=_type_log_document_choices)
    annexe_name = models.CharField(max_length=150, blank=True, null=True) 
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"Téléchargement {self.annexe_name or self.doc_type} — {self.dossier} — user {self.user_id}"

    class Meta:
        verbose_name = "Log de Téléchargement"
        verbose_name_plural = "Logs de Téléchargement"