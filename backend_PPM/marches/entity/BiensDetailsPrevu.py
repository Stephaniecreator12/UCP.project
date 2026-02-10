from django.db import models
from marches.entity.Biens import Biens
from datetime import timedelta

class BiensDetailsPrevu(models.Model):
    id = models.AutoField(primary_key=True)
    biens = models.ForeignKey(Biens, on_delete=models.CASCADE)
    prevu = models.CharField(max_length=255)
    listesetspecifications = models.DateField(null=True, blank=True)
    dossiers_appel = models.DateField(null=True, blank=True)
    date_lancement = models.DateField(null=True, blank=True)
    date_ouverture = models.DateField(null=True, blank=True)
    rapport_evaluation = models.DateField(null=True, blank=True)
    date_signature = models.DateField(null=True, blank=True)
    date_livraison = models.DateField(null=True, blank=True)
    commentaire = models.TextField(null=True, blank=True)
    duree = models.IntegerField(default=60)
   
    class Meta:
        db_table = "biens_details_prevu"
