from django.conf import settings
from django.db import models

from apps.common.models import ChoiceGroup, reference_choices

from .seance_ouverture import SeanceOuverture


def _decision_membre_seance_choices():
    return reference_choices(ChoiceGroup.DECISION_MEMBRE_SEANCE, MembreSeance.Decision.choices)


class MembreSeance(models.Model):
    class Decision(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        VALIDEE = "VALIDEE", "Validee"
        REJETEE = "REJETEE", "Rejetee"

    seance = models.ForeignKey(
        SeanceOuverture,
        on_delete=models.CASCADE,
        related_name="membres",
    )
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="participations_ouverture",
    )
    nom_prenom = models.CharField(max_length=255, blank=True)
    numero_carte = models.CharField(max_length=50, blank=True)
    intitule = models.CharField(max_length=255, blank=True)
    poste = models.CharField(max_length=255, blank=True)
    est_present = models.BooleanField(default=True)
    a_valide = models.BooleanField(default=False)
    decision = models.CharField(
        max_length=20,
        choices=_decision_membre_seance_choices,
        default=Decision.EN_ATTENTE,
    )
    commentaire = models.TextField(blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    ip_adresse = models.GenericIPAddressField(null=True, blank=True)
    navigateur = models.CharField(max_length=255, blank=True)
    validation_password_hash = models.CharField(max_length=255, blank=True)
    validation_password_generated_at = models.DateTimeField(null=True, blank=True)
    validation_password_consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["seance", "utilisateur"],
                name="unique_membre_par_seance",
            )
        ]
        ordering = ["id"]

    def __str__(self):
        return f"{self.seance.reference_dossier} - {self.utilisateur.username}"
