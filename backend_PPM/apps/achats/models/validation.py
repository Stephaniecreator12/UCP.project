from django.contrib.auth import get_user_model
from django.db import models

from apps.achats.models.demande_achat import DemandeAchat

User = get_user_model()


class ValidationDemande(models.Model):
    ROLE_SERVICE = "SERVICE"
    ROLE_BUDGET = "BUDGET"
    ROLE_DIRECTION = "DIRECTION"

    ROLE_CHOICES = [
        (ROLE_SERVICE, "Responsable service"),
        (ROLE_BUDGET, "Contrôleur budget"),
        (ROLE_DIRECTION, "Directeur"),
    ]

    STATUT_EN_ATTENTE = "EN_ATTENTE"
    STATUT_APPROUVE = "APPROUVE"
    STATUT_REJETE = "REJETE"

    STATUT_CHOICES = [
        (STATUT_EN_ATTENTE, "En attente"),
        (STATUT_APPROUVE, "Approuvé"),
        (STATUT_REJETE, "Rejeté"),
    ]

    FONDS_DISPONIBLES = "DISPONIBLES"
    FONDS_INSUFFISANTS = "INSUFFISANTS"

    FONDS_CHOICES = [
        (FONDS_DISPONIBLES, "Fonds disponibles"),
        (FONDS_INSUFFISANTS, "Fonds insuffisants"),
    ]

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        related_name="validations",
    )
    validateur = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="validations_achat",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUT_EN_ATTENTE,
    )
    commentaire = models.TextField(blank=True)
    fonds_statut = models.CharField(
        max_length=20,
        choices=FONDS_CHOICES,
        blank=True,
        null=True,
    )
    visa = models.CharField(max_length=255, blank=True)
    date_validation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("date_validation",)
        constraints = [
            models.UniqueConstraint(
                fields=["demande", "role"],
                name="unique_validation_role_per_demande",
            )
        ]

    def __str__(self):
        return f"{self.demande.numero_demande} - {self.role}"
