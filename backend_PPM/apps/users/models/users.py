from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    class Role(models.TextChoices):
        DEMANDEUR = "demandeur", "Demandeur"
        VERIFICATEUR_TECHNIQUE = "verificateur_technique", "Vérificateur technique"
        APPROBATEUR_FINAL = "approbateur_final", "Approbateur final"
        AUDITEUR = "auditeur", "Auditeur"

        

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.DEMANDEUR,
        db_index=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"

