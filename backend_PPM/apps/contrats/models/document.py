import hashlib

from django.db import models

from apps.contrats.models.enums import TypeDocumentContrat
from apps.contrats.models.contrats import Contrat

class DocumentContrat(models.Model):

    contrat = models.ForeignKey(
        Contrat,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    type_document = models.CharField(
        max_length=30,
        choices=TypeDocumentContrat.choices
    )

    fichier = models.FileField(
        upload_to="contrats/"
    )

    hash_sha256 = models.CharField(
        max_length=64,
        editable=False
    )

    date_upload = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "documents_contrat"

    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)

        if self.fichier:

            sha = hashlib.sha256()

            with self.fichier.open("rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    sha.update(chunk)

            self.hash_sha256 = sha.hexdigest()

            super().save(update_fields=["hash_sha256"])