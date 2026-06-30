from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.TdrSt.models.TdrSt import (
    TdrStDocument,
    TdrStDocumentFileVersion,
    TdrStValidationAction,
)
from apps.TdrSt.services.emailService import (
    send_demande_final_approve_email,
    send_document_submitted_email,
    send_document_suspended_email,
    send_final_decision_email,
    send_tech_decision_email,
)
from apps.TdrSt.services.schema_compat import (
    MISSING_TDR_LINK_MIGRATION_MESSAGE,
    has_tdr_demande_link_column,
)
from apps.users.models import UserProfile
from apps.users.services.permissions import get_user_role

LOCKED_DEMANDE_FIELDS = {
    "unite_technique",
    "intitule",
    "reference_ptba",
    "montant_estime_usd",
}


def _default_seuil_passation_usd() -> Decimal:
    raw = getattr(settings, "TDRST_SEUIL_PASSATION_DEFAULT_USD", None)
    if raw is None:
        return Decimal("50000.00")
    try:
        return Decimal(str(raw))
    except Exception:
        return Decimal("50000.00")


def _effective_seuil_passation(doc: TdrStDocument) -> Decimal | None:
    if doc.seuil_passation is not None:
        return doc.seuil_passation
    return _default_seuil_passation_usd()


def _build_numero_document(doc: TdrStDocument) -> str:
    year = doc.created_at.year if doc.created_at else timezone.now().year
    prefix = "TDR" if doc.type_document == "TDR" else "ST"
    same_type_count = TdrStDocument.objects.filter(
        type_document=doc.type_document,
        created_at__year=year,
    ).count()
    next_number = same_type_count + 1
    return f"UCP/{prefix}/{year}/{next_number:04d}"


@transaction.atomic
def create_document(validated_data: dict, user) -> TdrStDocument:
    demande_achat_id = validated_data.pop("demande_achat_id", None)
    demande_achat = None

    if not has_tdr_demande_link_column():
        raise ValidationError({"detail": MISSING_TDR_LINK_MIGRATION_MESSAGE})

    if demande_achat_id:
        from apps.achats.models import DemandeAchat

        demande_achat = DemandeAchat.objects.select_related("demandeur").filter(
            id=demande_achat_id
        ).first()
        if not demande_achat:
            raise ValidationError({"demande_achat_id": "Le dossier etat de besoin est introuvable."})
        if getattr(demande_achat, "demandeur_id", None) != getattr(user, "id", None):
            raise ValidationError({"detail": "Seul le demandeur du dossier peut creer son TDR/ST lie."})

        try:
            existing_document = demande_achat.tdr_st_document
        except Exception:
            existing_document = None
        if existing_document is not None:
            return existing_document

    doc = TdrStDocument.objects.create(demandeur=user, demande_achat=demande_achat, **validated_data)
    doc.numero_document = _build_numero_document(doc)
    doc.save(update_fields=["numero_document"])
    return doc


@transaction.atomic
def update_document(doc: TdrStDocument, validated_data: dict, user) -> TdrStDocument:
    if getattr(doc, "demandeur_id", None) != getattr(user, "id", None):
        raise ValidationError({"detail": "Seul le demandeur peut modifier ce document."})
    if doc.statut not in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Modification autorisee uniquement en brouillon/a revoir."})

    if doc.demande_achat_id:
        for locked_field in LOCKED_DEMANDE_FIELDS:
            if locked_field in validated_data:
                validated_data[locked_field] = getattr(doc, locked_field)

    for key, value in validated_data.items():
        setattr(doc, key, value)
    doc.save()
    return doc


def _validate_document_ready_for_submission(doc: TdrStDocument) -> None:
    errors: dict[str, str] = {}
    if not doc.sources_financement:
        errors["sources_financement"] = "La source de financement doit etre renseignee avant soumission."
    if not (doc.ligne_budgetaire or "").strip():
        errors["ligne_budgetaire"] = "La ligne budgetaire doit etre renseignee avant soumission."
    if not (doc.numero_subvention or "").strip():
        errors["numero_subvention"] = "Le numero de subvention doit etre renseigne avant soumission."
    if errors:
        raise ValidationError(errors)


def list_my_documents(user):
    return (
        TdrStDocument.objects.filter(demandeur=user)
        .select_related("fichier_courant", "demande_achat")
        .order_by("-updated_at", "-created_at")
    )


def _all_documents_queryset():
    return TdrStDocument.objects.select_related(
        "demandeur",
        "fichier_courant",
        "demande_achat",
    ).order_by("-updated_at", "-created_at")


def _role_documents_queryset(queryset):
    return (
        queryset.distinct()
        .select_related("demandeur", "fichier_courant", "demande_achat")
        .order_by("-updated_at", "-created_at")
    )


def list_pending_tech():
    return _role_documents_queryset(
        TdrStDocument.objects.filter(statut=TdrStDocument.Statut.SOUMIS)
    )


def list_tech_documents(user):
    pending = TdrStDocument.objects.filter(statut=TdrStDocument.Statut.SOUMIS)
    treated_by_user = TdrStDocument.objects.filter(
        actions_validation__etape=TdrStValidationAction.Etape.VALIDATION_TECHNIQUE,
        actions_validation__acteur=user,
    ).filter(
        Q(statut=TdrStDocument.Statut.A_REVOIR)
        | Q(
            statut__in=(
                TdrStDocument.Statut.VALIDE,
                TdrStDocument.Statut.REJETE,
                TdrStDocument.Statut.SUSPENDU,
            )
        )
    )
    return _role_documents_queryset(pending | treated_by_user)


def list_pending_final():
    return _role_documents_queryset(
        TdrStDocument.objects.filter(statut=TdrStDocument.Statut.EN_VALIDATION)
    )


def list_final_documents(user):
    pending = TdrStDocument.objects.filter(statut=TdrStDocument.Statut.EN_VALIDATION)
    treated_by_user = TdrStDocument.objects.filter(
        actions_validation__etape=TdrStValidationAction.Etape.APPROBATION_FINALE,
        actions_validation__acteur=user,
    ).filter(
        Q(statut__in=(TdrStDocument.Statut.A_REVOIR, TdrStDocument.Statut.REJETE))
        | Q(statut__in=(TdrStDocument.Statut.VALIDE, TdrStDocument.Statut.SUSPENDU))
    )
    return _role_documents_queryset(pending | treated_by_user)


def list_auditeur_documents():
    return (
        TdrStDocument.objects.filter(
            statut__in=(
                TdrStDocument.Statut.VALIDE,
                TdrStDocument.Statut.REJETE,
                TdrStDocument.Statut.SUSPENDU,
            )
        )
        .select_related("demandeur", "fichier_courant", "demande_achat")
        .prefetch_related("actions_validation__acteur")
        .order_by("-updated_at")
    )


def list_all_documents_for_demandeur():
    return _all_documents_queryset()


def list_all_documents_for_tech():
    return _role_documents_queryset(
        TdrStDocument.objects.filter(
            statut__in=(
                TdrStDocument.Statut.SOUMIS,
                TdrStDocument.Statut.A_REVOIR,
                TdrStDocument.Statut.VALIDE,
                TdrStDocument.Statut.REJETE,
                TdrStDocument.Statut.SUSPENDU,
            )
        )
    )


def list_all_documents_for_final():
    return _role_documents_queryset(
        TdrStDocument.objects.filter(
            statut__in=(
                TdrStDocument.Statut.EN_VALIDATION,
                TdrStDocument.Statut.A_REVOIR,
                TdrStDocument.Statut.REJETE,
                TdrStDocument.Statut.VALIDE,
                TdrStDocument.Statut.SUSPENDU,
            )
        )
    )


def list_documents_for_user(user, scope: str = "mine"):
    if scope == "all":
        return _all_documents_queryset()

    role = get_user_role(user)
    if role == UserProfile.Role.DEMANDEUR:
        return list_my_documents(user)
    if role == UserProfile.Role.VERIFICATEUR_TECHNIQUE:
        return list_tech_documents(user)
    if role == UserProfile.Role.APPROBATEUR_FINAL:
        return list_final_documents(user)
    if role == UserProfile.Role.AUDITEUR:
        return list_auditeur_documents()
    return TdrStDocument.objects.none()


@transaction.atomic
def submit_document(doc: TdrStDocument, user) -> TdrStDocument:
    if getattr(doc, "demandeur_id", None) != getattr(user, "id", None):
        raise ValidationError({"detail": "Seul le demandeur peut soumettre ce document."})
    if doc.statut not in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Seuls les brouillons/a revoir peuvent etre soumis."})

    _validate_document_ready_for_submission(doc)

    previous_status = doc.statut
    doc.statut = TdrStDocument.Statut.SOUMIS
    doc.save(update_fields=["statut", "updated_at"])

    TdrStValidationAction.objects.create(
        document=doc,
        etape=TdrStValidationAction.Etape.DEPOT,
        acteur=user,
        meta={"action": "RESUBMIT", "previous_status": previous_status},
    )

    send_document_submitted_email(doc)
    return doc


@transaction.atomic
def tech_decide(doc: TdrStDocument, user, decision: str, observations: str = "") -> TdrStDocument:
    if doc.statut not in (TdrStDocument.Statut.SOUMIS, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Decision technique impossible pour ce statut."})

    if decision == TdrStValidationAction.Decision.FAVORABLE:
        next_statut = TdrStDocument.Statut.EN_VALIDATION
    elif decision == TdrStValidationAction.Decision.A_REVOIR:
        next_statut = TdrStDocument.Statut.A_REVOIR
    else:
        raise ValidationError({"decision": "Decision technique invalide."})

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

    send_tech_decision_email(doc, decision, observations)
    if next_statut == TdrStDocument.Statut.EN_VALIDATION:
        send_demande_final_approve_email(doc)

    return doc


@transaction.atomic
def final_decide(doc: TdrStDocument, user, decision: str, observations: str = "") -> TdrStDocument:
    if doc.statut != TdrStDocument.Statut.EN_VALIDATION:
        raise ValidationError({"statut": "Decision finale impossible pour ce statut."})

    if decision == TdrStValidationAction.Decision.APPROUVE:
        next_statut = TdrStDocument.Statut.VALIDE
    elif decision == TdrStValidationAction.Decision.REJETE:
        next_statut = TdrStDocument.Statut.REJETE
    else:
        raise ValidationError({"decision": "Decision finale invalide."})

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

    if decision == TdrStValidationAction.Decision.APPROUVE:
        send_final_decision_email(doc, decision, observations)
        if doc.demande_achat_id:
            from apps.achats.services.demande_service import submit_demande

            demande = doc.demande_achat
            funding_code = ""
            if isinstance(doc.sources_financement, list) and doc.sources_financement:
                funding_code = str(doc.sources_financement[0] or "").strip()
            if not funding_code:
                funding_code = (doc.ligne_budgetaire or "").strip()

            demande.source_financement = funding_code
            demande.ligne_budgetaire = (doc.ligne_budgetaire or funding_code or "").strip()
            demande.numero_subvention = (doc.numero_subvention or "").strip()
            demande.save(
                update_fields=[
                    "source_financement",
                    "ligne_budgetaire",
                    "numero_subvention",
                    "updated_at",
                ]
            )

            if demande.demandeur and demande.statut in (
                demande.STATUT_BROUILLON,
                demande.STATUT_A_COMPLETER,
            ):
                submit_demande(demande, demande.demandeur)

    return doc


def requires_ano(doc: TdrStDocument) -> bool:
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
        raise ValidationError({"statut": "Le document est deja suspendu."})
    if doc.statut in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Ce document doit etre soumis avant de pouvoir etre suspendu."})

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

    send_document_suspended_email(doc, observations)
    return doc


@transaction.atomic
def add_new_file_version(doc: TdrStDocument, uploaded_file, user) -> TdrStDocumentFileVersion:
    if getattr(doc, "demandeur_id", None) != getattr(user, "id", None):
        raise ValidationError({"detail": "Seul le demandeur peut televerser une version."})
    if doc.statut not in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        raise ValidationError({"statut": "Televersement autorise uniquement en brouillon/a revoir."})

    existing_versions = list(doc.versions_fichier.order_by("-version"))
    max_version = existing_versions[0].version if existing_versions else 0
    next_version = max_version + 1

    if len(existing_versions) >= 2:
        versions_to_delete = existing_versions[1:]
        for old_version in versions_to_delete:
            if old_version.fichier_pdf:
                old_version.fichier_pdf.delete(save=False)
            old_version.delete()

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
        snapshot_data=snapshot,
    )

    version_obj.empreinte_sha256 = version_obj.compute_sha256()
    version_obj.save(update_fields=["empreinte_sha256"])

    doc.fichier_courant = version_obj
    doc.version = next_version
    doc.save(update_fields=["fichier_courant", "version", "updated_at"])
    return version_obj
