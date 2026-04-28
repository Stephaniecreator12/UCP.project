from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db import models
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.TdrSt.models.TdrSt import TdrStDocument, TdrStDocumentFileVersion, TdrStValidationAction

# IMPORTS POUR LES EMAILS
from apps.TdrSt.services.emailService import (
    send_document_submitted_email,
    send_tech_decision_email,
    send_demande_final_approve_email,
    send_final_decision_email,
    send_document_suspended_email,
)


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
    doc = TdrStDocument.objects.create(demandeur=user, **validated_data)
    doc.numero_document = _build_numero_document(doc)
    doc.save(update_fields=["numero_document"])

    return doc


@transaction.atomic
def update_document(doc: TdrStDocument, validated_data: dict, user) -> TdrStDocument:
    if getattr(doc, "demandeur_id", None) != getattr(user, "id", None):
        raise ValidationError({"detail": "Seul le demandeur peut modifier ce document."})
    if doc.statut not in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Modification autorisée uniquement en brouillon/à revoir."})

    for key, value in validated_data.items():
        setattr(doc, key, value)
    doc.save()

    return doc


def list_my_documents(user):
    return TdrStDocument.objects.filter(demandeur=user).select_related("fichier_courant")


def list_pending_tech():
    return (
        TdrStDocument.objects.filter(statut=TdrStDocument.Statut.SOUMIS)
        .select_related("demandeur", "fichier_courant")
        .order_by("-created_at")
    )


def _list_role_documents_with_history(*, pending_qs, treated_etape: str, user=None):
    """
    Helper pour les roles validateurs:
    - pending_qs: documents "en cours" pour le role
    - treated_etape: etape a utiliser pour retrouver l'historique
    - user (optionnel): si fourni, limite l'historique aux documents traites par cet utilisateur
    """
    treated = TdrStDocument.objects.filter(actions_validation__etape=treated_etape)
    if user is not None:
        treated = treated.filter(actions_validation__acteur=user)
    return (
        (pending_qs | treated)
        .distinct()
        .select_related("demandeur", "fichier_courant")
        .order_by("-updated_at")
    )


def list_tech_documents(user):
    """
    Pour les verificateurs techniques:
    - inclut les documents en attente (SOUMIS)
    - inclut aussi les documents deja traites (historique)
    """
    # Documents en attente de validation technique
    pending = TdrStDocument.objects.filter(statut=TdrStDocument.Statut.SOUMIS)
    
    # Documents déjà traités par ce vérificateur
    treated = TdrStDocument.objects.filter(
        actions_validation__etape=TdrStValidationAction.Etape.VALIDATION_TECHNIQUE,
        actions_validation__acteur=user
    )
    
    resubmitted = TdrStDocument.objects.filter(
        statut=TdrStDocument.Statut.A_REVOIR,
        actions_validation__etape=TdrStValidationAction.Etape.DEPOT,
        actions_validation__meta__action="RESUBMIT"
    )

    return (pending | treated | resubmitted).distinct().select_related(
        "demandeur", "fichier_courant"
    ).order_by("-updated_at")


def list_pending_final():
    return (
        TdrStDocument.objects.filter(statut=TdrStDocument.Statut.EN_VALIDATION)
        .select_related("demandeur", "fichier_courant")
        .order_by("-created_at")
    )


def list_final_documents(user):
    """
    Pour les approbateurs finaux:
    - inclut les documents en attente (EN_VALIDATION)
    - inclut aussi les documents deja traites (historique)
    """
    pending = TdrStDocument.objects.filter(statut=TdrStDocument.Statut.EN_VALIDATION)
    return _list_role_documents_with_history(
        pending_qs=pending,
        treated_etape=TdrStValidationAction.Etape.APPROBATION_FINALE,
        user=None,
    )

def list_auditeur_documents():
    """
    Pour les auditeurs (lecture seule, a posteriori) :
    - Uniquement les documents à statut final : VALIDE, REJETE, SUSPENDU.
    - La traçabilité complète (Section G / actions_validation) est incluse via prefetch
      pour que l'auditeur puisse vérifier le respect des procédures.
    - Aucune action de décision n'est possible depuis ce queryset.
    """
    return (
        TdrStDocument.objects.filter(
            statut__in=(
                TdrStDocument.Statut.VALIDE,
                TdrStDocument.Statut.REJETE,
                TdrStDocument.Statut.SUSPENDU,
            )
        )
        .select_related("demandeur", "fichier_courant")
        .prefetch_related("actions_validation__acteur")  # Section G — traçabilité complète
        .order_by("-updated_at")
    )


@transaction.atomic
def submit_document(doc: TdrStDocument, user) -> TdrStDocument:
    if getattr(doc, "demandeur_id", None) != getattr(user, "id", None):
        raise ValidationError({"detail": "Seul le demandeur peut soumettre ce document."})
    
    # Autoriser la soumission depuis BROUILLON ou A_REVOIR
    if doc.statut not in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Seuls les brouillons/à revoir peuvent être soumis."})
    
    # Passer en SOUMIS (même si c'était A_REVOIR)
    doc.statut = TdrStDocument.Statut.SOUMIS
    doc.save(update_fields=["statut", "updated_at"])
    
    # Créer une nouvelle action de dépôt
    TdrStValidationAction.objects.create(
        document=doc,
        etape=TdrStValidationAction.Etape.DEPOT,
        acteur=user,
        meta={"action": "RESUBMIT", "previous_status": "A_REVOIR"},
    )
    
    # ENVOI EMAIL AUX VERIFICATEURS TECHNIQUES
    send_document_submitted_email(doc)
    
    return doc


@transaction.atomic
def tech_decide(doc: TdrStDocument, user, decision: str, observations: str = "") -> TdrStDocument:
    # Permettre la décision même si le document était déjà en A_REVOIR
    if doc.statut not in (TdrStDocument.Statut.SOUMIS, TdrStDocument.Statut.A_REVOIR):
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
    
    # Envoyer l'email au demandeur
    send_tech_decision_email(doc, decision, observations)
    
    # Si le document passe en validation finale, notifier les approbateurs
    if next_statut == TdrStDocument.Statut.EN_VALIDATION:
        send_demande_final_approve_email(doc)
    
    return doc


@transaction.atomic
def final_decide(doc: TdrStDocument, user, decision: str, observations: str = "") -> TdrStDocument:
    if doc.statut != TdrStDocument.Statut.EN_VALIDATION:
        raise ValidationError({"statut": "Décision finale impossible pour ce statut."})

    if decision == TdrStValidationAction.Decision.APPROUVE:
      next_statut = TdrStDocument.Statut.VALIDE
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
    
    # ENVOI DES EMAILS SELON LE CAS
    if decision == TdrStValidationAction.Decision.APPROUVE:
        print(f"[EMAIL] Envoi email au demandeur pour décision finale - document {doc.numero_document}")
        send_final_decision_email(doc, decision, observations)
    
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
    
    # ENVOI EMAIL AU DEMANDEUR POUR SUSPENSION
    print(f"[EMAIL] Envoi email au demandeur pour suspension - document {doc.numero_document}")
    send_document_suspended_email(doc, observations)

    return doc

@transaction.atomic
def add_new_file_version(doc: TdrStDocument, uploaded_file, user) -> TdrStDocumentFileVersion:
    if getattr(doc, "demandeur_id", None) != getattr(user, "id", None):
        raise ValidationError({"detail": "Seul le demandeur peut téléverser une version."})
    if doc.statut not in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Téléversement autorisé uniquement en brouillon/à revoir."})
    
    next_version = (doc.versions_fichier.aggregate(models.Max("version")).get("version__max") or 0) + 1
    
    # ⭐ CAPTURE DE L'ÉTAT COMPLET DU DOCUMENT
    snapshot = {
        "unite_technique": doc.unite_technique,
        "type_document": doc.type_document,
        "categorie_activite": doc.categorie_activite,
        "intitule": doc.intitule,
        "reference_ptba": doc.reference_ptba,
        "periode_debut": str(doc.periode_debut) if doc.periode_debut else None,
        "periode_fin": str(doc.periode_fin) if doc.periode_fin else None,
        "duree_estimee_valeur": doc.duree_estimee_valeur,
        "duree_estimee_unite": doc.duree_estimee_unite,
        "sources_financement": doc.sources_financement,
        "numero_subvention": doc.numero_subvention,
        "ligne_budgetaire": doc.ligne_budgetaire,
        "montant_estime_usd": str(doc.montant_estime_usd) if doc.montant_estime_usd else None,
        "procedure_envisagee": doc.procedure_envisagee,
        "statut": doc.statut,
    }
    
    version_obj = TdrStDocumentFileVersion.objects.create(
        document=doc,
        version=next_version,
        fichier_pdf=uploaded_file,
        fichier_nom_original=getattr(uploaded_file, "name", "") or "",
        fichier_taille_octets=getattr(uploaded_file, "size", None),
        uploaded_by=user,
        snapshot_data=snapshot,  # ⭐ STOCKAGE DU SNAPSHOT
    )
    
    version_obj.empreinte_sha256 = version_obj.compute_sha256()
    version_obj.save(update_fields=["empreinte_sha256"])

    doc.fichier_courant = version_obj
    doc.version = next_version
    doc.save(update_fields=["fichier_courant", "version", "updated_at"])

    return version_obj
