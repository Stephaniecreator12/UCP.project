from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    class Role(models.TextChoices):
        INITIATEUR = "initiateur", "Initiateur"
        VERIFICATEUR_TECHNIQUE = "verificateur_technique", "Vérificateur technique"
        APPROBATEUR_FINAL = "approbateur_final", "Approbateur final"
        BAILLEUR = "bailleur", "Bailleur"
        AUDITEUR = "auditeur", "Auditeur"


    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.INITIATEUR,
        db_index=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"

