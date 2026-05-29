from django.db import models
from apps.procurement.models.procurement_market import ProcurementMarket
class LogDownload(models.Model):
    TYPE_CHOICES = [
        ('DAO', 'DAO Principal'),
        ('ANNEXE', 'Fichier Annexe'),
    ]
    
    dossier = models.ForeignKey(ProcurementMarket, on_delete=models.CASCADE, related_name="logs_telechargements", db_index=True)
    
    user_id = models.BigIntegerField(db_index=True)
    
    doc_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    annexe_name = models.CharField(max_length=150, blank=True, null=True) 
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Log de Téléchargement"