from django.contrib.auth import get_user_model
from django.db import models

from apps.achats.models.demande_achat import DemandeAchat

User = get_user_model()


class WorkflowHistory(models.Model):
    ACTION_CREATE = "CREATE"
    ACTION_SUBMIT = "SUBMIT"
    ACTION_APPROVE = "APPROVE"
    ACTION_REJECT = "REJECT"
    ACTION_TRANSMIT = "TRANSMIT"

    ACTION_CHOICES = [
        (ACTION_CREATE, "Création"),
        (ACTION_SUBMIT, "Soumission"),
        (ACTION_APPROVE, "Validation"),
        (ACTION_REJECT, "Rejet"),
        (ACTION_TRANSMIT, "Transmission marchés"),
    ]

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        related_name="workflow_history",
    )
    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    old_status = models.CharField(max_length=30, blank=True)
    new_status = models.CharField(max_length=30, blank=True)
    commentaire = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self):
        return f"{self.demande.numero_demande} - {self.action}"
