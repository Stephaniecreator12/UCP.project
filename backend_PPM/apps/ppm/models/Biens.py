
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
    listesetspecifications = models.DateField(null=True, blank=True)
    prevu = models.CharField(null=True, blank=True)
    reel = models.CharField(null=True, blank=True)
    commentaire = models.TextField(null=True, blank=True)
    statut = models.CharField(max_length=255, null=True, blank=True)
    

    # --- DATES PREVUES (Sert de référence, peut être calculé une fois à la création) ---
    dossiers_appel_prevu = models.DateField(null=True, blank=True)
    date_lancement_prevu = models.DateField(null=True, blank=True)
    date_ouverture_prevu = models.DateField(null=True, blank=True)
    rapport_evaluation_prevu = models.DateField(null=True, blank=True)
    date_signature_prevu = models.DateField(null=True, blank=True)
    date_livraison_prevu = models.DateField(null=True, blank=True)
    duree = models.IntegerField(default=60)

    # --- DATES REELLES (Saisie manuelle progressive) ---
    dossiers_appel_reel = models.DateField(null=True, blank=True)
    date_lancement_reel = models.DateField(null=True, blank=True)
    date_ouverture_reel = models.DateField(null=True, blank=True)
    rapport_evaluation_reel = models.DateField(null=True, blank=True)
    date_signature_reel = models.DateField(null=True, blank=True)
    date_livraison_reel = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.code_suivi or ''} — {self.intitule}" if self.code_suivi else self.intitule

    class Meta:
        db_table = "biens"
        verbose_name = "Bien"
        verbose_name_plural = "Biens"