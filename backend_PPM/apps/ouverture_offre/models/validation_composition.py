from django.conf import settings
from django.db import models

from .seance_ouverture import SeanceOuverture


class ValidationCompositionMembre(models.Model):
    class RoleValidateur(models.TextChoices):
        CN = "CN", "Coordonnateur National"
        GP = "GP", "Gestionnaire de Programme"
        RPM = "RPM", "Responsable Passation de Marché"

    class Decision(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        VALIDEE = "VALIDEE", "Validee"
        REJETEE = "REJETEE", "Rejetee"

    seance = models.ForeignKey(
        SeanceOuverture,
        on_delete=models.CASCADE,
        related_name="validations_composition",
    )
    role = models.CharField(max_length=8, choices=RoleValidateur.choices)
    validateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="validations_composition_membres",
    )
    notification_sent_at = models.DateTimeField(null=True, blank=True)
    decision = models.CharField(
        max_length=20,
        choices=Decision.choices,
        default=Decision.EN_ATTENTE,
    )
    commentaire = models.TextField(blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["seance", "role"],
                name="unique_composition_role_par_seance",
            ),
        ]
        ordering = ["seance_id", "role"]

    def __str__(self):
        return f"{self.seance.reference_dossier} — {self.role} — {self.decision}"
