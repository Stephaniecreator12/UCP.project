from django.contrib.auth import get_user_model
from django.db import models

from apps.achats.models.demande_achat import DemandeAchat

User = get_user_model()


class HistoriqueDemande(models.Model):
    ACTION_DEMANDE_CREEE = "DEMANDE_CREEE"
    ACTION_DEMANDE_SOUMISE = "DEMANDE_SOUMISE"
    ACTION_VALIDATION = "VALIDATION"
    ACTION_COMMANDE_EMISE = "COMMANDE_EMISE"
    ACTION_LIVRAISON_MISE_A_JOUR = "LIVRAISON_MISE_A_JOUR"
    ACTION_RECEPTION_ENREGISTREE = "RECEPTION_ENREGISTREE"
    ACTION_DEMANDE_CLOTUREE = "DEMANDE_CLOTUREE"

    ACTION_CHOICES = [
        (ACTION_DEMANDE_CREEE, "Demande créée"),
        (ACTION_DEMANDE_SOUMISE, "Demande soumise"),
        (ACTION_VALIDATION, "Validation enregistrée"),
        (ACTION_COMMANDE_EMISE, "Commande émise"),
        (ACTION_LIVRAISON_MISE_A_JOUR, "Livraison mise à jour"),
        (ACTION_RECEPTION_ENREGISTREE, "Réception enregistrée"),
        (ACTION_DEMANDE_CLOTUREE, "Demande clôturée"),
    ]

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        related_name="historiques",
    )
    action = models.CharField(max_length=40, choices=ACTION_CHOICES)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="historiques_achats",
    )
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.demande} - {self.action}"
