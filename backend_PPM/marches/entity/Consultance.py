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
    commentaire = models.TextField(null=True, blank=True)
    
# -- DATES PREVU --
    TdR_prevu = models.DateField(null=True, blank=True)
    ami_prevu = models.DateField(null=True, blank=True)
    liste_restreinte_prevu = models.DateField(null=True, blank=True)
    demande_proposition_prevu = models.DateField(null=True, blank=True)
    date_invitation_prevu = models.DateField(null=True, blank=True)
    date_ouverture_prevu = models.DateField(null=True, blank=True)
    rapport_evaluation_prevu = models.DateField(null=True, blank=True)
    ouverture_plis_prevu = models.DateField(null=True, blank=True)
    projet_contrat_prevu = models.DateField(null=True, blank=True)
    date_signature_prevu = models.DateField(null=True, blank=True)
    date_fin_prevu = models.DateField(null=True, blank=True)
    duree = models.IntegerField(default=60)

# -- DATES REELLES --
    TdR_reel = models.DateField(null=True, blank=True)
    ami_reel = models.DateField(null=True, blank=True)
    liste_restreinte_reel = models.DateField(null=True, blank=True)
    demande_proposition_reel = models.DateField(null=True, blank=True)
    date_invitation_reel = models.DateField(null=True, blank=True)
    date_ouverture_reel = models.DateField(null=True, blank=True)
    rapport_evaluation_reel = models.DateField(null=True, blank=True)
    ouverture_plis_reel = models.DateField(null=True, blank=True)
    projet_contrat_reel = models.DateField(null=True, blank=True)
    date_signature_reel = models.DateField(null=True, blank=True)
    date_fin_reel = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "consultance"