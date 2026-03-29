from django.contrib.auth import get_user_model
from django.db import models

from apps.achats.models.demande_achat import DemandeAchat

User = get_user_model()


class ValidationDemande(models.Model):
    DECISION_VALIDEE = "VALIDEE"
    DECISION_REJETEE = "REJETEE"
    DECISION_A_COMPLETER = "A_COMPLETER"

    DECISION_CHOICES = [
        (DECISION_VALIDEE, "Validee"),
        (DECISION_REJETEE, "Rejetee"),
        (DECISION_A_COMPLETER, "A completer"),
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
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES)
    commentaire = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.demande} - {self.decision}"
