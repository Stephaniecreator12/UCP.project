from __future__ import annotations

import hashlib

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.common.models import ChoiceGroup, reference_choices, reference_codes
from apps.procurement.models.procurement_market import ProcedureType, FinancingSource


def _procedure_envisagee_choices():
    # Données partagées avec le module procurement (type de procédure).
    return reference_choices(ChoiceGroup.PROCEDURE_TYPE, ProcedureType.choices)


def _type_document_tdr_st_choices():
    defaults = [
        ("TDR", "Termes de Référence (TDR)"),
        ("ST", "Spécifications Techniques (ST)"),
    ]
    return reference_choices(ChoiceGroup.TYPE_DOCUMENT_TDR_ST, defaults)


def _statut_tdr_st_choices():
    defaults = [
        ("BROUILLON", "Brouillon"),
        ("SOUMIS", "Soumis"),
        ("EN_VALIDATION", "En validation"),
        ("A_REVOIR", "à revoir"),
        ("EN_ATTENTE_ANO", "En attente ANO"),
        ("VALIDE", "Validé"),
        ("REJETE", "Rejeté"),
        ("SUSPENDU", "Suspendu"),
    ]
    return reference_choices(ChoiceGroup.STATUT_TDR_ST, defaults)


def _categorie_activite_choices():
    defaults = [
        ("FORMATION", "Formation"),
        ("ATELIER", "Atelier"),
        ("REUNION", "Réunion"),
        ("REVUE", "Revue"),
        ("SUPERVISION", "Supervision"),
        ("ETUDE", "Etude"),
        ("CONSULTANT", "Consultant"),
        ("CABINET", "Cabinet"),
        ("BUREAU_ETUDES", "Bureau d'études"),
        ("ENTREPRISE", "Entreprise"),
        ("BIENS", "Biens"),
        ("INFRASTRUCTURE", "Infrastructure"),
    ]
    return reference_choices(ChoiceGroup.CATEGORIE_ACTIVITE, defaults)


def _duree_unite_choices():
    defaults = [
        ("JOURS", "Jours"),
        ("MOIS", "Mois"),
    ]
    return reference_choices(ChoiceGroup.DUREE_UNITE, defaults)


def _etape_validation_tdr_st_choices():
    defaults = [
        ("DEPOT", "Dépôt"),
        ("VALIDATION_TECHNIQUE", "Validation technique"),
        ("APPROBATION_FINALE", "Approbation finale"),
        ("ANO", "Avis de Non-Objection (ANO)"),
        ("SUSPENSION", "Suspension"),
    ]
    return reference_choices(ChoiceGroup.ETAPE_VALIDATION_TDR_ST, defaults)


def _decision_validation_tdr_st_choices():
    defaults = [
        ("FAVORABLE", "Favorable"),
        ("A_REVOIR", "À revoir"),
        ("APPROUVE", "Approuvé"),
        ("REJETE", "Rejeté"),
        ("SUSPENDU", "Suspendu"),
        ("ANO_ACCORDE", "ANO accordé"),
        ("ANO_REFUSE", "ANO refusé"),
    ]
    return reference_choices(ChoiceGroup.DECISION_VALIDATION_TDR_ST, defaults)


def valid_financing_sources():
    """Codes de financement acceptés pour un TDR/ST.

    Union des sources centralisées (familles FM/GAVI/BM, modifiables via l'admin)
    et des codes budgétaires fins du module achats (SRPS_CS7_FM, RSS3_GAVI, ...).
    """
    from apps.achats.models.demande_achat import DemandeAchat

    valid = set(reference_codes(ChoiceGroup.FINANCING_SOURCE, FinancingSource.choices))
    valid.update(code for code, _ in DemandeAchat.SOURCE_FINANCEMENT_CHOICES)
    return valid


class TdrStDocument(models.Model):
    class TypeDocument(models.TextChoices):
        TDR = "TDR", "Termes de Référence (TDR)"
        ST = "ST", "Spécifications Techniques (ST)"

    class Statut(models.TextChoices):
        BROUILLON = "BROUILLON", "Brouillon"
        SOUMIS = "SOUMIS", "Soumis"
        EN_VALIDATION = "EN_VALIDATION", "En validation"
        A_REVOIR = "A_REVOIR", "à revoir"
        EN_ATTENTE_ANO = "EN_ATTENTE_ANO", "En attente ANO"
        VALIDE = "VALIDE", "Validé"
        REJETE = "REJETE", "Rejeté"
        SUSPENDU = "SUSPENDU", "Suspendu"

    class CategorieActivite(models.TextChoices):
        FORMATION = "FORMATION", "Formation"
        ATELIER = "ATELIER", "Atelier"
        REUNION = "REUNION", "Réunion"
        REVUE = "REVUE", "Revue"
        SUPERVISION = "SUPERVISION", "Supervision"
        ETUDE = "ETUDE", "Etude"
        CONSULTANT = "CONSULTANT", "Consultant"
        CABINET = "CABINET", "Cabinet"
        BUREAU_ETUDES = "BUREAU_ETUDES", "Bureau d'Ã©tudes"
        ENTREPRISE = "ENTREPRISE", "Entreprise"
        BIENS = "BIENS", "Biens"
        INFRASTRUCTURE = "INFRASTRUCTURE", "Infrastructure"

    class ProcedureEnvisagee(models.TextChoices):
        DC = "DC", "DC"
        AOI = "AOI", "AOI"
        AON = "AON", "AON"
        GRE_A_GRE = "GRE_A_GRE", "Gré à gré"

    class DureeUnite(models.TextChoices):
        JOURS = "JOURS", "Jours"
        MOIS = "MOIS", "Mois"

    numero_document = models.CharField(max_length=32, blank=True, db_index=True)
    version = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    demandeur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tdr_st_documents",
        db_column="demandeur_id",
    )
    demande_achat = models.OneToOneField(
        "achats.DemandeAchat",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tdr_st_document",
    )
    unite_technique = models.CharField(max_length=255)

    statut = models.CharField(
        max_length=20,
        choices=_statut_tdr_st_choices,
        default=Statut.BROUILLON,
        db_index=True,
    )

    type_document = models.CharField(max_length=3, choices=_type_document_tdr_st_choices)
    categorie_activite = models.CharField(max_length=32, choices=_categorie_activite_choices)
    intitule = models.CharField(max_length=255)
    reference_ptba = models.CharField(max_length=100)

    periode_debut = models.DateField()
    periode_fin = models.DateField()
    duree_estimee_valeur = models.PositiveIntegerField()
    duree_estimee_unite = models.CharField(max_length=8, choices=_duree_unite_choices)

    sources_financement = models.JSONField(default=list)
    numero_subvention = models.CharField(max_length=100, blank=True)
    ligne_budgetaire = models.CharField(max_length=100, blank=True)
    montant_estime_usd = models.DecimalField(max_digits=14, decimal_places=2)

    seuil_passation = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    procedure_envisagee = models.CharField(max_length=20, choices=_procedure_envisagee_choices)

    fichier_courant = models.ForeignKey(
        "TdrStDocumentFileVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    class Meta:
        db_table = "tdr_st_document"
        ordering = ["-created_at"]

    def clean(self):
        if self.periode_debut and self.periode_fin and self.periode_fin < self.periode_debut:
            raise ValidationError({"periode_fin": "La date de fin doit être supérieure ou égale à la date de début."})

        if not isinstance(self.sources_financement, list):
            raise ValidationError({"sources_financement": "Ce champ doit être une liste."})

        valid_sources = valid_financing_sources()
        for source in self.sources_financement:
            if source not in valid_sources:
                raise ValidationError(
                    {"sources_financement": f"'{source}' n'est pas une source de financement valide."}
                )


def _upload_to(instance: "TdrStDocumentFileVersion", filename: str) -> str:
    base = instance.document.numero_document or f"tdr-st-{instance.document_id}"
    safe_base = base.replace("/", "_")
    return f"tdr_st/{safe_base}/V{instance.version}/{filename}"


class TdrStDocumentFileVersion(models.Model):
    document = models.ForeignKey(
        TdrStDocument,
        on_delete=models.CASCADE,
        related_name="versions_fichier",
    )
    version = models.PositiveIntegerField()

    fichier_pdf = models.FileField(upload_to=_upload_to)
    fichier_nom_original = models.CharField(max_length=255, blank=True)
    fichier_taille_octets = models.BigIntegerField(null=True, blank=True)
    empreinte_sha256 = models.CharField(max_length=64, blank=True, db_index=True)

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tdr_st_uploads",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    snapshot_data = models.JSONField(default=dict, blank=True) #Snapshot des métadonnées au moment de la création de la version

    class Meta:
        db_table = "tdr_st_document_file_version"
        unique_together = (("document", "version"),)
        ordering = ["-version"]

    def compute_sha256(self) -> str:
        hasher = hashlib.sha256()
        for chunk in self.fichier_pdf.chunks():
            hasher.update(chunk)
        return hasher.hexdigest()


class TdrStValidationAction(models.Model):
    class Etape(models.TextChoices):
        DEPOT = "DEPOT", "Dépôt"
        VALIDATION_TECHNIQUE = "VALIDATION_TECHNIQUE", "Validation technique"
        APPROBATION_FINALE = "APPROBATION_FINALE", "Approbation finale"
        ANO = "ANO", "Avis de Non-Objection (ANO)"
        SUSPENSION = "SUSPENSION", "Suspension"

    class Decision(models.TextChoices):
        FAVORABLE = "FAVORABLE", "Favorable"
        A_REVOIR = "A_REVOIR", "À revoir"
        APPROUVE = "APPROUVE", "Approuvé"
        REJETE = "REJETE", "Rejeté"
        SUSPENDU = "SUSPENDU", "Suspendu"
        ANO_ACCORDE = "ANO_ACCORDE", "ANO accordé"
        ANO_REFUSE = "ANO_REFUSE", "ANO refusé"

    document = models.ForeignKey(
        TdrStDocument,
        on_delete=models.CASCADE,
        related_name="actions_validation",
    )
    etape = models.CharField(max_length=32, choices=_etape_validation_tdr_st_choices)
    decision = models.CharField(max_length=16, choices=_decision_validation_tdr_st_choices, blank=True)
    observations = models.TextField(blank=True)

    acteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tdr_st_validation_actions",
    )
    horodatage = models.DateTimeField(auto_now_add=True)
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "tdr_st_validation_action"
        ordering = ["-horodatage"] 
