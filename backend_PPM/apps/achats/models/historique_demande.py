from django.contrib.auth import get_user_model
from django.db import models

from apps.achats.models.demande_achat import DemandeAchat
from apps.common.models import ChoiceGroup, reference_choices

User = get_user_model()


def _action_historique_achat_choices():
    defaults = [
        ("DEMANDE_CREEE", "Demande créée"),
        ("DEMANDE_SOUMISE", "Demande soumise"),
        ("VALIDATION", "Validation enregistrée"),
        ("BUDGET_VALIDE", "Budget validé"),
        ("COMMANDE_EMISE", "Commande émise"),
        ("LIVRAISON_MISE_A_JOUR", "Livraison mise à jour"),
        ("RECEPTION_ENREGISTREE", "Réception enregistrée"),
        ("ECART_RESOLU", "Écart résolu"),
        ("DEMANDE_CLOTUREE", "Demande clôturée"),
        ("RAPPEL_VALIDATION_24H", "Rappel validation 24h"),
    ]
    return reference_choices(ChoiceGroup.ACTION_HISTORIQUE_ACHAT, defaults)


class HistoriqueDemande(models.Model):
    ACTION_DEMANDE_CREEE = "DEMANDE_CREEE"
    ACTION_DEMANDE_SOUMISE = "DEMANDE_SOUMISE"
    ACTION_VALIDATION = "VALIDATION"
    ACTION_BUDGET_VALIDE = "BUDGET_VALIDE"
    ACTION_COMMANDE_EMISE = "COMMANDE_EMISE"
    ACTION_LIVRAISON_MISE_A_JOUR = "LIVRAISON_MISE_A_JOUR"
    ACTION_RECEPTION_ENREGISTREE = "RECEPTION_ENREGISTREE"
    ACTION_ECART_RESOLU = "ECART_RESOLU"
    ACTION_DEMANDE_CLOTUREE = "DEMANDE_CLOTUREE"
    ACTION_RAPPEL_VALIDATION_24H = "RAPPEL_VALIDATION_24H"

    ACTION_CHOICES = [
        (ACTION_DEMANDE_CREEE, "Demande créée"),
        (ACTION_DEMANDE_SOUMISE, "Demande soumise"),
        (ACTION_VALIDATION, "Validation enregistrée"),
        (ACTION_BUDGET_VALIDE, "Budget validé"),
        (ACTION_COMMANDE_EMISE, "Commande émise"),
        (ACTION_LIVRAISON_MISE_A_JOUR, "Livraison mise à jour"),
        (ACTION_RECEPTION_ENREGISTREE, "Réception enregistrée"),
        (ACTION_ECART_RESOLU, "Écart résolu"),
        (ACTION_DEMANDE_CLOTUREE, "Demande clôturée"),
        (ACTION_RAPPEL_VALIDATION_24H, "Rappel validation 24h"),
    ]

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        related_name="historiques",
    )
    action = models.CharField(max_length=40, choices=_action_historique_achat_choices)
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
