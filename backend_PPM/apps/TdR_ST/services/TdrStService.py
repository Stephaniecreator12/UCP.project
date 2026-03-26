from __future__ import annotations

from django.db import transaction
from django.db import models

from apps.TdR_ST.models.TdR_ST import TdrStDocument, TdrStDocumentFileVersion, TdrStValidationAction


def _build_numero_document(doc: TdrStDocument) -> str:
    year = doc.created_at.year if doc.created_at else None
    if not year:
        from django.utils import timezone

        year = timezone.now().year
    return f"UCP/DOC/{year}/{doc.id:05d}"


@transaction.atomic
def create_document(validated_data: dict, user) -> TdrStDocument:
    doc = TdrStDocument.objects.create(initiateur=user, **validated_data)
    doc.numero_document = _build_numero_document(doc)
    doc.save(update_fields=["numero_document"])

    TdrStValidationAction.objects.create(
        document=doc,
        etape=TdrStValidationAction.Etape.DEPOT,
        acteur=user,
        meta={"action": "CREATE_DRAFT"},
    )

    return doc


def list_my_documents(user):
    return TdrStDocument.objects.filter(initiateur=user).select_related("fichier_courant")


@transaction.atomic
def submit_document(doc: TdrStDocument, user) -> TdrStDocument:
    doc.statut = TdrStDocument.Statut.SOUMIS
    doc.save(update_fields=["statut", "updated_at"])
    TdrStValidationAction.objects.create(
        document=doc,
        etape=TdrStValidationAction.Etape.VALIDATION_TECHNIQUE,
        acteur=user,
        meta={"action": "SUBMIT"},
    )
    return doc


@transaction.atomic
def add_new_file_version(doc: TdrStDocument, uploaded_file, user) -> TdrStDocumentFileVersion:
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
