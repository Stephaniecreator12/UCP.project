from django.db import models

from apps.achats.models.demande_achat import DemandeAchat
from apps.common.models import ChoiceGroup, reference_choices


def _type_document_achat_choices():
    defaults = [
        ("SPECIFICATIONS_TECHNIQUES", "Specifications techniques detaillees"),
        ("TDR_SIMPLIFIE", "Termes de Reference simplifies"),
        ("DEVIS_ESTIMATIF", "Devis estimatif"),
        ("BON_SORTIE_STOCK", "Bon de sortie stock"),
        ("BON_LIVRAISON", "Bon de livraison"),
        ("PV_RECEPTION", "Proces-verbal de reception"),
    ]
    return reference_choices(ChoiceGroup.TYPE_DOCUMENT_ACHAT, defaults)


class DocumentDemande(models.Model):
    TYPE_SPECIFICATIONS = "SPECIFICATIONS_TECHNIQUES"
    TYPE_TDR = "TDR_SIMPLIFIE"
    TYPE_DEVIS = "DEVIS_ESTIMATIF"
    TYPE_BON_SORTIE = "BON_SORTIE_STOCK"
    TYPE_BON_LIVRAISON = "BON_LIVRAISON"
    TYPE_PV_RECEPTION = "PV_RECEPTION"

    TYPE_DOCUMENT_CHOICES = [
        (TYPE_SPECIFICATIONS, "Specifications techniques detaillees"),
        (TYPE_TDR, "Termes de Reference simplifies"),
        (TYPE_DEVIS, "Devis estimatif"),
        (TYPE_BON_SORTIE, "Bon de sortie stock"),
        (TYPE_BON_LIVRAISON, "Bon de livraison"),
        (TYPE_PV_RECEPTION, "Proces-verbal de reception"),
    ]

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    type_document = models.CharField(
        max_length=40,
        choices=_type_document_achat_choices,
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
