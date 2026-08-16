from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator, MinValueValidator
from decimal import Decimal

from apps.ouverture_offre.models import OffreOuverture, SeanceOuverture

User = get_user_model()


class StatutContrat(models.TextChoices):
    BROUILLON = "BROUILLON", "À contractualiser"
    ATTENTE_SIGNATURE = "ATTENTE_SIGNATURE", "En attente de signature"
    EXECUTION = "EXECUTION", "En exécution"
    TERMINE = "TERMINE", "Terminé"
    SUSPENDU = "SUSPENDU", "Suspendu"
    ANNULE = "ANNULE", "Annulé"


# ============================================================
# CONTRAT PRINCIPAL
# ============================================================
class Contrat(models.Model):
    """
    Modèle NOTI5 - Contractualisation
    1 ligne = 1 contrat avec 1 prestataire (rang 1 de l'évaluation)
    """

    # Liaison avec évaluation
    seance = models.ForeignKey(
        SeanceOuverture,
        on_delete=models.PROTECT,
        related_name="contrats",
    )
    offre_gagnante = models.ForeignKey(
        OffreOuverture,
        on_delete=models.PROTECT,
        related_name="contrat",
        help_text="Offre classée Rang 1 après évaluation",
    )

    # Infos contrat
    numero_marche = models.CharField(
        max_length=50,
        unique=True,
        help_text="Ex: UCP/DAO/2026/0001",
    )
    statut = models.CharField(
        max_length=20,
        choices=StatutContrat.choices,
        default=StatutContrat.BROUILLON,
    )

    # Prestataire (depuis offre_gagnante.nom_soumissionnaire)
    nom_prestataire = models.CharField(max_length=255)
    email_prestataire = models.EmailField()
    telephone_prestataire = models.CharField(max_length=50, blank=True)
    nif_prestataire = models.CharField(max_length=50, blank=True)
    stat_prestataire = models.CharField(max_length=50, blank=True)
    representant_signataire = models.CharField(max_length=255, blank=True)

    # Montants et durée
    montant_ttc = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    date_signature = models.DateField(null=True, blank=True)
    duree_execution = models.CharField(max_length=100, blank=True)  # "6 mois"

    # Clauses
    clauses_particulieres = models.TextField(blank=True)

    # Métadonnées
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="contrats_crees",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["statut", "-created_at"]),
            models.Index(fields=["numero_marche"]),
        ]

    def __str__(self):
        return f"{self.numero_marche} — {self.nom_prestataire}"


# ============================================================
# ÉCHÉANCIER DE PAIEMENT
# ============================================================
class EcheancierPaiement(models.Model):
    """
    Lignes de paiement (40%, 30%, 30% etc)
    Liée à Contrat
    """

    class StatutPaiement(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        FACTURE_RECUE = "FACTURE_RECUE", "Facture reçue"
        PAYE = "PAYE", "Payé"

    contrat = models.ForeignKey(
        Contrat,
        on_delete=models.CASCADE,
        related_name="echeancier",
    )

    montant = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    pourcentage = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Pourcentage du montant total (40, 30, 30)",
    )
    etape = models.CharField(
        max_length=200,
        help_text="Ex: 'Signature contrat', 'Livraison 50%', 'Livraison 100%'",
    )
    date_prevue = models.DateField()
    statut = models.CharField(
        max_length=20,
        choices=StatutPaiement.choices,
        default=StatutPaiement.EN_ATTENTE,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date_prevue"]

    def __str__(self):
        return f"{self.contrat.numero_marche} — {self.pourcentage}% ({self.etape})"


# ============================================================
# DOCUMENT CONTRAT (PDF SIGNÉ)
# ============================================================
class DocumentContrat(models.Model):
    """
    PDF du contrat signé
    Stocke le fichier + hash SHA256 pour intégrité (Fonds Mondial)
    """

    class TypeDocument(models.TextChoices):
        CONTRAT_SIGNE = "CONTRAT_SIGNE", "Contrat signé"
        AVENANT = "AVENANT", "Avenant"

    contrat = models.ForeignKey(
        Contrat,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    type_document = models.CharField(
        max_length=20,
        choices=TypeDocument.choices,
        default=TypeDocument.CONTRAT_SIGNE,
    )

    fichier = models.FileField(
        upload_to="contrats/",
        validators=[FileExtensionValidator(["pdf"])],
    )

    hash_sha256 = models.CharField(
        max_length=64,
        blank=True,
        help_text="Hash SHA256 du fichier pour vérifier l'intégrité",
    )

    date_upload = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="documents_uploads",
    )

    class Meta:
        ordering = ["-date_upload"]

    def __str__(self):
        return f"{self.contrat.numero_marche} — {self.get_type_document_display()}"



# AUDIT TRAIL (OBLIGATOIRE FONDS MONDIAL)
class AuditTrailContrat(models.Model):
    """
    Piste d'audit complète
    Chaque modification est tracée
    """

    class Action(models.TextChoices):
        CREATE = "CREATE", "Création"
        UPDATE = "UPDATE", "Modification"
        UPLOAD = "UPLOAD", "Upload document"
        DELETE = "DELETE", "Suppression document"
        SEND = "SEND", "Envoi au prestataire"
        SIGN = "SIGN", "Signature"
        VALIDATE = "VALIDATE", "Validation"
        CANCEL = "CANCEL", "Annulation"

    contrat = models.ForeignKey(
        Contrat,
        on_delete=models.CASCADE,
        related_name="audit_trail",
    )

    action = models.CharField(
        max_length=20,
        choices=Action.choices,
    )

    utilisateur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
    )

    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    # Métadonnées optionnelles
    ancienne_valeur = models.TextField(blank=True)
    nouvelle_valeur = models.TextField(blank=True)
    champ_modifie = models.CharField(max_length=100, blank=True)

    # Audit de sécurité
    ip_adresse = models.GenericIPAddressField(null=True, blank=True)
    navigateur = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["contrat", "-timestamp"]),
            models.Index(fields=["action", "-timestamp"]),
        ]

    def __str__(self):
        return f"{self.contrat.numero_marche} — {self.get_action_display()} ({self.timestamp})"
