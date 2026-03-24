from django.db import models
# Importez votre modèle de Bon de Commande / Achat existant ici

class Reception(models.Model):
    # Référence au Bon de Commande (BC) issu de la phase de passation
    achat = models.ForeignKey('DemandeAchat', on_api=models.CASCADE, related_name='receptions')
    numero_bc = models.CharField(max_length=100) # [cite: 77]
    date_reception = models.DateTimeField(auto_now_add=True) # [cite: 107]
    receptionnaire = models.CharField(max_length=255) # [cite: 107]
    
    # Statut : En attente / Réceptionné partiel / Réceptionné complet [cite: 107]
    statut_reception = models.CharField(max_length=50, default='En attente')
    
    # Documents : Bon de livraison et PV de réception [cite: 107]
    bon_livraison_file = models.FileField(upload_to='receptions/bl/', null=True, blank=True)
    pv_reception_file = models.FileField(upload_to='receptions/pv/', null=True, blank=True)
    observations_generales = models.TextField(null=True, blank=True)

class ReceptionItem(models.Model):
    reception = models.ForeignKey(Reception, on_delete=models.CASCADE, related_name='items')
    designation = models.CharField(max_length=255)
    quantite_commandee = models.IntegerField()
    quantite_reçue = models.IntegerField() # [cite: 107]
    
    # Conformité : Conforme / Non conforme / Défectueux [cite: 107]
    etat_qualite = models.CharField(max_length=50) 

class Ecart(models.Model):
    # Section 9.3 : Gestion des écarts [cite: 109]
    reception_item = models.OneToOneField(ReceptionItem, on_delete=models.CASCADE)
    type_ecart = models.CharField(max_length=100) # Manquant / Défectueux / Non conforme
    description_probleme = models.TextField()
    action_corrective = models.CharField(max_length=100) # Remplacement / Réparation / Avoir [cite: 109]
    resolu = models.BooleanField(default=False)