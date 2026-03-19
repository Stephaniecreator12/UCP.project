from django.db import models
from django.contrib.auth import get_user_model
from apps.achats.models.demande_achat import DemandeAchat

User = get_user_model()


class ValidationDemande(models.Model):

    ROLE_CHOICES = [
        ("SERVICE", "Responsable service"),
        ("BUDGET", "Contrôleur budget"),
        ("DIRECTION", "Directeur"),
    ]

    STATUT_CHOICES = [
        ("EN_ATTENTE", "En attente"),
        ("APPROUVE", "Approuvé"),
        ("REJETE", "Rejeté"),
    ]

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        related_name="validations"
    )

    validateur = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        null=True,
        blank=True
    )

    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default="EN_ATTENTE"
    )

    commentaire = models.TextField(
        blank=True
    )

    date_validation = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.demande.numero_demande} - {self.role or self.statut}"
