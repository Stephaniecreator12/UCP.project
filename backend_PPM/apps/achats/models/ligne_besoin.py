from django.db import models

from apps.achats.models.demande_achat import DemandeAchat


class LigneBesoin(models.Model):
    TYPE_SERVICE_FORMATION = "FORMATION"
    TYPE_SERVICE_MAINTENANCE = "MAINTENANCE"
    TYPE_SERVICE_REPARATION = "REPARATION"
    TYPE_SERVICE_NETTOYAGE = "NETTOYAGE"
    TYPE_SERVICE_PRESTATION = "PRESTATION_PONCTUELLE"

    TYPE_SERVICE_CHOICES = [
        (TYPE_SERVICE_FORMATION, "Formation"),
        (TYPE_SERVICE_MAINTENANCE, "Maintenance"),
        (TYPE_SERVICE_REPARATION, "Reparation"),
        (TYPE_SERVICE_NETTOYAGE, "Nettoyage"),
        (TYPE_SERVICE_PRESTATION, "Prestation ponctuelle"),
    ]

    demande = models.ForeignKey(
        DemandeAchat,
        on_delete=models.CASCADE,
        related_name="lignes_besoin",
    )

    ordre = models.PositiveIntegerField(default=1)

    designation = models.CharField(max_length=255, blank=True)
    marque_modele = models.CharField(max_length=255, blank=True)
    caracteristiques_techniques = models.TextField(blank=True)
    quantite = models.PositiveIntegerField(null=True, blank=True)
    unite = models.CharField(max_length=50, blank=True)
    prix_unitaire_estime = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )
    cout_total_estime = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )
    lieu_livraison = models.CharField(max_length=255, blank=True)
    destinataire_final = models.CharField(max_length=255, blank=True)

    type_service = models.CharField(
        max_length=30,
        choices=TYPE_SERVICE_CHOICES,
        blank=True,
    )
    description_service = models.TextField(blank=True)
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    duree_estimee = models.CharField(max_length=100, blank=True)
    lieu_execution = models.CharField(max_length=255, blank=True)
    livrables_attendus = models.TextField(blank=True)
    nombre_beneficiaires = models.PositiveIntegerField(null=True, blank=True)
    quantite_recue = models.PositiveIntegerField(null=True, blank=True)
    observation_reception = models.TextField(blank=True)

    class Meta:
        ordering = ["ordre", "id"]

    def __str__(self):
        return f"{self.demande} - ligne {self.ordre}"
