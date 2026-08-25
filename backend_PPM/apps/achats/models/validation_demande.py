from django.contrib.auth import get_user_model
from django.db import models

from apps.achats.models.demande_achat import DemandeAchat, _etape_validation_achat_choices
from apps.common.models import ChoiceGroup, reference_choices

User = get_user_model()


def _decision_validation_choices():
    defaults = [
        ("FAVORABLE", "Favorable"),
        ("DEFAVORABLE", "Defavorable"),
        ("A_COMPLETER", "A completer"),
        ("APPROUVEE", "Approuvee"),
        ("REJETEE", "Rejetee"),
        ("A_REVOIR", "A revoir"),
    ]
    return reference_choices(ChoiceGroup.DECISION_VALIDATION, defaults)


class ValidationDemande(models.Model):
    DECISION_FAVORABLE = "FAVORABLE"
    DECISION_DEFAVORABLE = "DEFAVORABLE"
    DECISION_A_COMPLETER = "A_COMPLETER"
    DECISION_APPROUVEE = "APPROUVEE"
    DECISION_REJETEE = "REJETEE"
    DECISION_A_REVOIR = "A_REVOIR"

    DECISION_CHOICES = [
        (DECISION_FAVORABLE, "Favorable"),
        (DECISION_DEFAVORABLE, "Defavorable"),
        (DECISION_A_COMPLETER, "A completer"),
        (DECISION_APPROUVEE, "Approuvee"),
        (DECISION_REJETEE, "Rejetee"),
        (DECISION_A_REVOIR, "A revoir"),
    ]

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        related_name="validations",
    )
    validateur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validations_achat",
    )
    etape = models.CharField(
        max_length=30,
        choices=_etape_validation_achat_choices,
    )
    decision = models.CharField(max_length=20, choices=_decision_validation_choices)
    commentaire = models.TextField(blank=True)
    donnees_etape = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.demande} - {self.etape} - {self.decision}"
