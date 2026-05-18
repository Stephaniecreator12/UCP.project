from django.db import models
from apps.procurement.models.procurement_market import ProcurementMarket

class DateAtelier(models.Model):
    market = models.ForeignKey(
        ProcurementMarket, 
        on_delete=models.CASCADE, 
        related_name='dates_previsionnelles'
    )
    dates_atelier = models.DateTimeField()

    class Meta:
        verbose_name = "Date prévisionnelle"
        verbose_name = "Dates prévisionnelles"
        ordering = ['dates_atelier']

    def __str__(self):
        return f"{self.market.title} - {self.dates_atelier.strftime('%d/%m/%Y %H:%M')}"
