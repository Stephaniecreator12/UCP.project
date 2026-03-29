from django.db import models

from apps.achats.models.demande_achat import DemandeAchat


class DocumentDemande(models.Model):
    TYPE_SPECIFICATIONS = "SPECIFICATIONS_TECHNIQUES"
    TYPE_TDR = "TDR_SIMPLIFIE"
    TYPE_DEVIS = "DEVIS_ESTIMATIF"
    TYPE_BON_SORTIE = "BON_SORTIE_STOCK"

    TYPE_DOCUMENT_CHOICES = [
        (TYPE_SPECIFICATIONS, "Specifications techniques detaillees"),
        (TYPE_TDR, "Termes de Reference simplifies"),
        (TYPE_DEVIS, "Devis estimatif"),
        (TYPE_BON_SORTIE, "Bon de sortie stock"),
    ]

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    type_document = models.CharField(
        max_length=40,
        choices=TYPE_DOCUMENT_CHOICES,
    )
    fichier = models.FileField(
        upload_to="demandes/documents/",
        null=True,
        blank=True,
    )
    commentaire = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at", "id"]

    def __str__(self):
        return f"{self.demande} - {self.type_document}"
