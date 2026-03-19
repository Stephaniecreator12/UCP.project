from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class DemandeAchat(models.Model):

    STATUT_CHOICES = [
        ("BROUILLON", "Brouillon"),
        ("SOUMISE", "Soumise"),
        ("VALIDE_SERVICE", "Validée service"),
        ("VALIDE_BUDGET", "Validée budget"),
        ("VALIDE_DIRECTION", "Validée direction"),
        ("REJETEE", "Rejetée"),
        ("TRANSMISE_MARCHES", "Transmise aux marchés"),
    ]

    TYPE_MARCHE_CHOICES = [
        ("BIENS", "Biens"),
        ("SERVICES", "Services"),
        ("TRAVAUX", "Travaux"),
    ]

    # -----------------------
    # SECTION A IDENTIFICATION
    # -----------------------

    numero_demande = models.CharField(max_length=50, unique=True)

    date_demande = models.DateField(auto_now_add=True)

    service_demandeur = models.CharField(max_length=200)

    demandeur = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    fonction_demandeur = models.CharField(max_length=200)

    # -----------------------
    # SECTION B FINANCIER
    # -----------------------

    activite_ptba = models.CharField(max_length=255)

    indicateur_performance = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    source_financement = models.CharField(max_length=200)

    ligne_budgetaire = models.CharField(max_length=100)

    budget_estime = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    devise = models.CharField(
        max_length=10,
        default="USD"
    )

    # -----------------------
    # SECTION C DESCRIPTION
    # -----------------------

    type_marche = models.CharField(
        max_length=20,
        choices=TYPE_MARCHE_CHOICES
    )

    nature_activite = models.CharField(max_length=200)

    objet_demande = models.CharField(max_length=255)

    description = models.TextField()

    pieces_jointes = models.FileField(
        upload_to="demandes/",
        blank=True,
        null=True
    )

    # -----------------------
    # SECTION D PLANIFICATION
    # -----------------------

    region = models.CharField(max_length=200)

    adresse_livraison = models.CharField(max_length=255)

    date_debut = models.DateField()

    date_fin = models.DateField()

    urgent = models.BooleanField(default=False)

    justification_urgence = models.TextField(
        blank=True,
        null=True
    )

    # -----------------------
    # WORKFLOW
    # -----------------------

    statut = models.CharField(
        max_length=30,
        choices=STATUT_CHOICES,
        default="BROUILLON"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.numero_demande
