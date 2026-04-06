from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db import models
from rest_framework.exceptions import ValidationError

from apps.TdrSt.models.TdrSt import TdrStDocument, TdrStDocumentFileVersion, TdrStValidationAction


def _default_seuil_passation_usd() -> Decimal:
    """
    Valeur de fallback (configurable) du seuil a partir duquel on exige une etape ANO.

    - Si `TDRST_SEUIL_PASSATION_DEFAULT_USD` est defini dans settings, on l'utilise.
    - Sinon, on prend 50000.00 USD par defaut.

    Le seuil au niveau document (`doc.seuil_passation`) reste prioritaire.
    """
    raw = getattr(settings, "TDRST_SEUIL_PASSATION_DEFAULT_USD", None)
    if raw is None:
        return Decimal("50000.00")
    try:
        return Decimal(str(raw))
    except Exception:
        return Decimal("50000.00")


def _effective_seuil_passation(doc: TdrStDocument) -> Decimal | None:
    # Si un seuil est defini sur le document, il prime; sinon on applique un fallback.
    if doc.seuil_passation is not None:
        return doc.seuil_passation
    return _default_seuil_passation_usd()


def _build_numero_document(doc: TdrStDocument) -> str:
    """
    Construit le numéro de document au format:
    - UCP/TDR/2026/0001 pour les TDR
    - UCP/ST/2026/0001 pour les ST
    L'incrémentation est séparée par type de document et par année.
    """
    from django.utils import timezone
    
    year = doc.created_at.year if doc.created_at else timezone.now().year
    
    # Déterminer le préfixe selon le type de document
    prefix = "TDR" if doc.type_document == "TDR" else "ST"
    
    # Compter les documents du même type et de la même année
    # On utilise filter sur l'année extraite de created_at
    same_type_count = TdrStDocument.objects.filter(
        type_document=doc.type_document,
        created_at__year=year
    ).count()
    
    # Le nouveau document n'est pas encore sauvegardé dans la base
    # donc on ajoute 1 pour obtenir le prochain numéro
    next_number = same_type_count + 1
    
    return f"UCP/{prefix}/{year}/{next_number:04d}"


@transaction.atomic
def create_document(validated_data: dict, user) -> TdrStDocument:
    doc = TdrStDocument.objects.create(initiateur=user, **validated_data)
    doc.numero_document = _build_numero_document(doc)
    doc.save(update_fields=["numero_document"])

    return doc


@transaction.atomic
def update_document(doc: TdrStDocument, validated_data: dict, user) -> TdrStDocument:
    if getattr(doc, "initiateur_id", None) != getattr(user, "id", None):
        raise ValidationError({"detail": "Seul l'initiateur peut modifier ce document."})
    if doc.statut not in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Modification autorisée uniquement en brouillon/à revoir."})

    for key, value in validated_data.items():
        setattr(doc, key, value)
    doc.save()

    return doc


def list_my_documents(user):
    return TdrStDocument.objects.filter(initiateur=user).select_related("fichier_courant")


def list_pending_tech():
    return (
        TdrStDocument.objects.filter(statut=TdrStDocument.Statut.SOUMIS)
        .select_related("initiateur", "fichier_courant")
        .order_by("-created_at")
    )


def list_pending_final():
    return (
        TdrStDocument.objects.filter(statut=TdrStDocument.Statut.EN_VALIDATION)
        .select_related("initiateur", "fichier_courant")
        .order_by("-created_at")
    )


def list_bailleur_documents():
    return (
        TdrStDocument.objects.filter(statut=TdrStDocument.Statut.EN_ATTENTE_ANO)
        .select_related("initiateur", "fichier_courant")
        .order_by("-created_at")
    )


@transaction.atomic
def submit_document(doc: TdrStDocument, user) -> TdrStDocument:
    if getattr(doc, "initiateur_id", None) != getattr(user, "id", None):
        raise ValidationError({"detail": "Seul l'initiateur peut soumettre ce document."})
    if doc.statut not in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Seuls les brouillons/à revoir peuvent être soumis."})
    doc.statut = TdrStDocument.Statut.SOUMIS
    doc.save(update_fields=["statut", "updated_at"])
    TdrStValidationAction.objects.create(
        document=doc,
        etape=TdrStValidationAction.Etape.DEPOT,
        acteur=user,
        meta={"action": "SUBMIT"},
    )
    return doc


@transaction.atomic
def tech_decide(doc: TdrStDocument, user, decision: str, observations: str = "") -> TdrStDocument:
    if doc.statut != TdrStDocument.Statut.SOUMIS:
        raise ValidationError({"statut": "Décision technique impossible pour ce statut."})

    if decision == TdrStValidationAction.Decision.FAVORABLE:
        next_statut = TdrStDocument.Statut.EN_VALIDATION
    elif decision == TdrStValidationAction.Decision.A_REVOIR:
        next_statut = TdrStDocument.Statut.A_REVOIR
    else:
        raise ValidationError({"decision": "Décision technique invalide."})

    TdrStValidationAction.objects.create(
        document=doc,
        etape=TdrStValidationAction.Etape.VALIDATION_TECHNIQUE,
        decision=decision,
        observations=observations or "",
        acteur=user,
        meta={"action": "TECH_DECISION"},
    )

    doc.statut = next_statut
    doc.save(update_fields=["statut", "updated_at"])
    return doc


@transaction.atomic
def final_decide(doc: TdrStDocument, user, decision: str, observations: str = "") -> TdrStDocument:
    if doc.statut != TdrStDocument.Statut.EN_VALIDATION:
        raise ValidationError({"statut": "Décision finale impossible pour ce statut."})

    if decision == TdrStValidationAction.Decision.APPROUVE:
        next_statut = (
            TdrStDocument.Statut.EN_ATTENTE_ANO if requires_ano(doc) else TdrStDocument.Statut.VALIDE
        )
    elif decision == TdrStValidationAction.Decision.REJETE:
        next_statut = TdrStDocument.Statut.REJETE
    else:
        raise ValidationError({"decision": "Décision finale invalide."})

    TdrStValidationAction.objects.create(
        document=doc,
        etape=TdrStValidationAction.Etape.APPROBATION_FINALE,
        decision=decision,
        observations=observations or "",
        acteur=user,
        meta={"action": "FINAL_DECISION"},
    )

    doc.statut = next_statut
    doc.save(update_fields=["statut", "updated_at"])
    return doc


def requires_ano(doc: TdrStDocument) -> bool:
    """
    Business rule for extra bailleur step:
    if `seuil_passation` is set and the estimated amount exceeds it, require ANO.
    """
    seuil = _effective_seuil_passation(doc)
    if seuil is None:
        return False
    try:
     return doc.montant_estime_usd is not None and doc.montant_estime_usd > seuil
    except Exception:
        return False


@transaction.atomic
def bailleur_decide(doc: TdrStDocument, user, decision: str, observations: str = "") -> TdrStDocument:
    if doc.statut != TdrStDocument.Statut.EN_ATTENTE_ANO:
        raise ValidationError({"statut": "Décision ANO impossible pour ce statut."})

    if decision == TdrStValidationAction.Decision.ANO_ACCORDE:
        next_statut = TdrStDocument.Statut.VALIDE
    elif decision == TdrStValidationAction.Decision.ANO_REFUSE:
        next_statut = TdrStDocument.Statut.REJETE
    else:
        raise ValidationError({"decision": "Décision ANO invalide."})

    TdrStValidationAction.objects.create(
        document=doc,
        etape=TdrStValidationAction.Etape.ANO,
        decision=decision,
        observations=observations or "",
        acteur=user,
        meta={"action": "ANO_DECISION"},
    )

    doc.statut = next_statut
    doc.save(update_fields=["statut", "updated_at"])
    return doc


@transaction.atomic
def suspendre_document(doc: TdrStDocument, user, observations: str = "") -> TdrStDocument:
    if doc.statut == TdrStDocument.Statut.SUSPENDU:
        raise ValidationError({"statut": "Le document est déjà suspendu."})

    if doc.statut in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Ce document doit être soumis avant de pouvoir être suspendu."})

    doc.statut = TdrStDocument.Statut.SUSPENDU
    doc.save(update_fields=["statut", "updated_at"])

    TdrStValidationAction.objects.create(
        document=doc,
        etape=TdrStValidationAction.Etape.SUSPENSION,
        decision=TdrStValidationAction.Decision.SUSPENDU,
        observations=observations or "",
        acteur=user,
        meta={"action": "SUSPEND"},
    )

    return doc


@transaction.atomic
def add_new_file_version(doc: TdrStDocument, uploaded_file, user) -> TdrStDocumentFileVersion:
    if getattr(doc, "initiateur_id", None) != getattr(user, "id", None):
        raise ValidationError({"detail": "Seul l'initiateur peut téléverser une version."})
    if doc.statut not in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Téléversement autorisé uniquement en brouillon/à revoir."})
    next_version = (doc.versions_fichier.aggregate(models.Max("version")).get("version__max") or 0) + 1
    version_obj = TdrStDocumentFileVersion.objects.create(
        document=doc,
        version=next_version,
        fichier_pdf=uploaded_file,
        fichier_nom_original=getattr(uploaded_file, "name", "") or "",
        fichier_taille_octets=getattr(uploaded_file, "size", None),
        uploaded_by=user,
    )
    version_obj.empreinte_sha256 = version_obj.compute_sha256()
    version_obj.save(update_fields=["empreinte_sha256"])

    doc.fichier_courant = version_obj
    doc.version = next_version
    doc.save(update_fields=["fichier_courant", "version", "updated_at"])

    TdrStValidationAction.objects.create(
        document=doc,
        etape=TdrStValidationAction.Etape.DEPOT,
        acteur=user,
        meta={"action": "UPLOAD_VERSION", "version": next_version, "sha256": version_obj.empreinte_sha256},
    )

    return version_obj
