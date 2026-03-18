#Ce modèle doit répondre à :
# Qui valide ? 👤
# À quel niveau ? (1, 2, 3) 🔢
# Quelle décision ? ✅❌
# Quand ? 📅
# Pourquoi ? 💬

from django.db import models
from django.contrib.auth.models import User
from .demande_achat import DemandeAchat


class ValidationDemande(models.Model):

    STATUT_VALIDATION = [
        ("EN_ATTENTE", "En attente"),
        ("APPROUVE", "Approuvé"),
        ("REJETE", "Rejeté"),
    ]

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        related_name="validations"
    )

    validateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    statut = models.CharField(
        max_length=20,
        choices=STATUT_VALIDATION,
        default="EN_ATTENTE"
    )

    commentaire = models.TextField(blank=True)

    date_validation = models.DateTimeField(auto_now_add=True)