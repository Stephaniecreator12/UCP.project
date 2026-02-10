from django.db import models

class Consultance(models.Model):
    id = models.AutoField(primary_key=True)
    ref_code_suivi = models.CharField(max_length=100,null=True, blank=True)
    intitule = models.CharField(max_length=255)
    agmoxdirection = models.CharField(max_length=255,null=True, blank=True)
    montant_estimatif = models.DecimalField(max_digits=15, decimal_places=2)
    methode = models.CharField(max_length=255)
    approche = models.CharField(max_length=255)
    revue = models.CharField(max_length=255)
    forfaitxtemps = models.CharField(max_length=255,null=True, blank=True)
    
    class Meta:
        db_table = "consultance"