from django.db import models
from marches.entity.Consultance import Consultance
from datetime import timedelta

class ConsultanceDetailsPrevu(models.Model):
    id = models.AutoField(primary_key=True)
    consultance = models.ForeignKey(Consultance, on_delete=models.CASCADE)
    TdR = models.DateField(null=True, blank=True)
    ami = models.DateField(null=True, blank=True)
    liste_restreinte = models.DateField(null=True, blank=True)
    demande_proposition = models.DateField(null=True, blank=True)
    date_invitation = models.DateField(null=True, blank=True)
    date_ouverture = models.DateField(null=True, blank=True)
    rapport_evaluation = models.DateField(null=True, blank=True)
    ouverture_plis = models.DateField(null=True, blank=True)
    projet_contrat = models.DateField(null=True, blank=True)
    date_signature = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    commentaire = models.TextField(null=True, blank=True)
    duree = models.IntegerField(default=60)
   
    class Meta:
        db_table = "consultance_details_prevu"
