from django.db import models

class DemandeAchat(models.Model):

    numero_demande = models.CharField(
        max_length=50,
        unique=True
    )

    date_demande = models.DateField()

    service = models.CharField(max_length=200)

    demandeur = models.CharField(max_length=200)

    fonction_demandeur = models.CharField(max_length=200)

    statut = models.CharField(
        max_length=50,
        default="brouillon"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.numero_demande
