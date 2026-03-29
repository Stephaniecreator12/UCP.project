from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class DemandeAchat(models.Model):
    CATEGORIE_NOUVEAU_BESOIN = "NOUVEAU_BESOIN"
    CATEGORIE_REAPPROVISIONNEMENT = "REAPPROVISIONNEMENT"
    CATEGORIE_REMPLACEMENT = "REMPLACEMENT"
    CATEGORIE_URGENCE = "URGENCE"

    CATEGORIE_CHOICES = [
        (CATEGORIE_NOUVEAU_BESOIN, "Nouveau besoin"),
        (CATEGORIE_REAPPROVISIONNEMENT, "Reapprovisionnement stock"),
        (CATEGORIE_REMPLACEMENT, "Remplacement equipement defectueux"),
        (CATEGORIE_URGENCE, "Urgence operationnelle"),
    ]

    TYPE_MATERIELS = "MATERIELS"
    TYPE_PETITS_SERVICES = "PETITS_SERVICES"
    TYPE_SERVICES_RECURRENTS = "SERVICES_RECURRENTS"

    TYPE_DEMANDE_CHOICES = [
        (TYPE_MATERIELS, "Materiels"),
        (TYPE_PETITS_SERVICES, "Petits services"),
        (TYPE_SERVICES_RECURRENTS, "Services recurrents"),
    ]

    PRIORITE_URGENT = "URGENT"
    PRIORITE_NORMAL = "NORMAL"

    PRIORITE_CHOICES = [
        (PRIORITE_URGENT, "Urgent"),
        (PRIORITE_NORMAL, "Normal"),
    ]

    SOURCE_FONDS_MONDIAL = "FONDS_MONDIAL"
    SOURCE_BANQUE_MONDIALE = "BANQUE_MONDIALE"
    SOURCE_GAVI = "GAVI"

    SOURCE_FINANCEMENT_CHOICES = [
        (SOURCE_FONDS_MONDIAL, "Fonds mondial"),
        (SOURCE_BANQUE_MONDIALE, "Banque mondiale"),
        (SOURCE_GAVI, "Alliance Gavi"),
    ]

    STATUT_BROUILLON = "BROUILLON"
    STATUT_SOUMISE = "SOUMISE"
    STATUT_A_COMPLETER = "A_COMPLETER"
    STATUT_VALIDEE = "VALIDEE"
    STATUT_REJETEE = "REJETEE"

    STATUT_CHOICES = [
        (STATUT_BROUILLON, "Brouillon"),
        (STATUT_SOUMISE, "Soumise"),
        (STATUT_A_COMPLETER, "A completer"),
        (STATUT_VALIDEE, "Validee"),
        (STATUT_REJETEE, "Rejetee"),
    ]

    numero_demande = models.CharField(max_length=30, unique=True, blank=True)
    version = models.PositiveIntegerField(default=1)

    demandeur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="demandes_achat",
    )

    unite_technique = models.CharField(max_length=255)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUT_BROUILLON,
    )

    categorie_besoin = models.CharField(
        max_length=30,
        choices=CATEGORIE_CHOICES,
    )
    type_demande = models.CharField(
        max_length=30,
        choices=TYPE_DEMANDE_CHOICES,
    )
    priorite = models.CharField(
        max_length=10,
        choices=PRIORITE_CHOICES,
        default=PRIORITE_NORMAL,
    )

    objet = models.CharField(max_length=255)
    justification = models.TextField()
    lien_ptba = models.CharField(max_length=255)
    service_beneficiaire = models.CharField(max_length=255)

    ligne_budgetaire = models.CharField(max_length=100)
    source_financement = models.CharField(
        max_length=30,
        choices=SOURCE_FINANCEMENT_CHOICES,
    )
    cout_total_estime = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.numero_demande or self.objet

