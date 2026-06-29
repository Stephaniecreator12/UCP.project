from django.db import models
from .seance_ouverture import SeanceOuverture


class PVDocument(models.Model):
    seance = models.OneToOneField(
        SeanceOuverture,
        on_delete=models.CASCADE,
        related_name="pv_document",
    )
    fichier = models.FileField(upload_to="pv_documents/")
    version = models.IntegerField(default=1)
    hash_document = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"PV - {self.seance.reference_dossier} (v{self.version})"
