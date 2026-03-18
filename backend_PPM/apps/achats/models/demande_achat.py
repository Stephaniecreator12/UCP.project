from django.db import models
from django.contrib.auth.models import User


class DemandeAchat(models.Model):

    TYPE_MARCHE = [
        ("BIENS", "Biens"),
        ("SERVICES", "Services"),
        ("TRAVAUX", "Travaux"),
    ]

    NATURE_ACTIVITE = [
        ("FORMATION", "Formation"),
        ("REUNION", "Réunion"),
        ("SUPERVISION", "Supervision"),
        ("REVUE", "Revue"),
        ("CONSTRUCTION", "Construction"),
        ("AUTRE", "Autre"),
    ]

    SOURCE_FINANCEMENT = [
        ("FONDS_MONDIAL", "Fonds Mondial"),
        ("GAVI", "Gavi"),
        ("BANQUE_MONDIALE", "Banque mondiale"),
        ("BUDGET_ETAT", "Budget Etat"),
        ("AUTRE", "Autre"),
    ]

    numero_demande = models.CharField(max_length=50, unique=True)

    date_demande = models.DateField(auto_now_add=True)

    service_demandeur = models.CharField(max_length=200)

    demandeur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    fonction_demandeur = models.CharField(max_length=200)

    activite_ptba = models.CharField(max_length=255)

    indicateur_performance = models.CharField(max_length=255, blank=True, null=True)

    source_financement = models.CharField(max_length=50, choices=SOURCE_FINANCEMENT)

    ligne_budgetaire = models.CharField(max_length=100)

    budget_estime = models.DecimalField(max_digits=12, decimal_places=2)

    devise = models.CharField(max_length=10)

    type_marche = models.CharField(max_length=20, choices=TYPE_MARCHE)

    nature_activite = models.CharField(max_length=50, choices=NATURE_ACTIVITE)

    objet_demande = models.CharField(max_length=255)

    description = models.TextField()

    piece_jointe = models.FileField(upload_to="demandes/", null=True, blank=True)

    region = models.CharField(max_length=200)

    adresse_livraison = models.TextField()

    date_debut = models.DateField()

    date_fin = models.DateField()

    urgent = models.BooleanField(default=False)

    justification_urgence = models.TextField(blank=True, null=True)

    statut = models.CharField(
        max_length=50,
        default="BROUILLON"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.numero_demande