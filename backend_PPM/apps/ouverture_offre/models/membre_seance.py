from django.conf import settings
from django.db import models

from .seance_ouverture import SeanceOuverture


class MembreSeance(models.Model):
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
    est_present = models.BooleanField(default=True)
    a_valide = models.BooleanField(default=False)
    commentaire = models.TextField(blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)

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
