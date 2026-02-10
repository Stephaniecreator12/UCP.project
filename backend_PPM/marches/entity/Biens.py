from django.db import models

class Biens(models.Model):
    id = models.AutoField(primary_key=True)
    code_suivi = models.CharField(max_length=100,null=True, blank=True)
    intitule = models.CharField(max_length=255)
    montant_estimatif = models.DecimalField(max_digits=15, decimal_places=2)
    agmo = models.CharField(max_length=255)
    methode_epm = models.CharField(max_length=255)
    approches = models.CharField(max_length=255)
    revue = models.CharField(max_length=255)
   

    class Meta:
        db_table = "biens"