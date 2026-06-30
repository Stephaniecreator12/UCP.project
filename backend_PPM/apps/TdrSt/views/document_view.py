from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.TdrSt.models.TdrSt import TdrStDocument
from apps.TdrSt.permissions import (
    CanCreateDocument,
    CanListMyDocuments,
    CanReadDocument,
    CanSubmitOrUploadOwnDocument,
)
from apps.TdrSt.serializers.document_serializer import (
    TdrStDocumentReadSerializer,
    TdrStDocumentWriteSerializer,
)
from apps.TdrSt.services.schema_compat import (
    MISSING_TDR_LINK_MIGRATION_MESSAGE,
    has_tdr_demande_link_column,
)
from apps.TdrSt.services.TdrStService import (
    create_document,
    list_documents_for_user,
    list_my_documents,
    submit_document,
    suspendre_document,
    update_document,
)


def _missing_link_response():
    return Response(
        {"detail": MISSING_TDR_LINK_MIGRATION_MESSAGE},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def documents_list_view(request):
    if not has_tdr_demande_link_column():
        return _missing_link_response()

    scope = (request.query_params.get("scope") or "mine").strip().lower()
    if scope not in {"mine", "all"}:
        return Response(
            {"detail": "Le scope doit etre 'mine' ou 'all'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    docs = list_documents_for_user(request.user, scope=scope)
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, CanCreateDocument])
def create_document_view(request):
    if not has_tdr_demande_link_column():
        return _missing_link_response()

    serializer = TdrStDocumentWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    doc = create_document(serializer.validated_data, request.user)
    return Response(TdrStDocumentReadSerializer(doc).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanListMyDocuments])
def my_documents_view(request):
    if not has_tdr_demande_link_column():
        return _missing_link_response()

    docs = list_my_documents(request.user)
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def document_detail_view(request, id: int):
    if not has_tdr_demande_link_column():
        return _missing_link_response()

    doc = get_object_or_404(TdrStDocument, id=id)
    perm = CanReadDocument()
    if not perm.has_object_permission(request, None, doc):
        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        return Response(TdrStDocumentReadSerializer(doc).data)

    # PATCH: only demandeur can edit in BROUILLON / A_REVOIR (enforced in service).
    serializer = TdrStDocumentWriteSerializer(doc, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    doc = update_document(doc, serializer.validated_data, request.user)
    return Response(TdrStDocumentReadSerializer(doc).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_document_view(request, id: int):
    if not has_tdr_demande_link_column():
        return _missing_link_response()

    doc = get_object_or_404(TdrStDocument, id=id)
    # Vérifier que l'utilisateur est le demandeur
    if doc.demandeur != request.user:
        return Response({"detail": "Seul le demandeur peut soumettre ce document."}, 
                       status=status.HTTP_403_FORBIDDEN)
    # Vérifier le statut (BROUILLON ou A_REVOIR)
    if doc.statut not in (TdrStDocument.Statut.BROUILLON, TdrStDocument.Statut.A_REVOIR):
        return Response({"detail": "Seuls les brouillons ou documents à revoir peuvent être soumis."},
                       status=status.HTTP_400_BAD_REQUEST)
    
    doc = submit_document(doc, request.user)
    return Response(TdrStDocumentReadSerializer(doc).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated, CanSubmitOrUploadOwnDocument])
def suspend_document_view(request, id: int):
    if not has_tdr_demande_link_column():
        return _missing_link_response()

    doc = get_object_or_404(TdrStDocument, id=id)
    perm = CanSubmitOrUploadOwnDocument()
    if not perm.has_object_permission(request, None, doc):
        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    doc = suspendre_document(doc, request.user)
    return Response(TdrStDocumentReadSerializer(doc).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_pdf_view(request, id: int):
    from apps.TdrSt.services.TdrStService import add_new_file_version

    if not has_tdr_demande_link_column():
        return _missing_link_response()

    doc = get_object_or_404(TdrStDocument, id=id)
    perm = CanSubmitOrUploadOwnDocument()
    if not perm.has_object_permission(request, None, doc):
        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
    uploaded_file = request.FILES.get("file")
    if uploaded_file is None:
        return Response({"file": "Fichier manquant."}, status=status.HTTP_400_BAD_REQUEST)

    name = (uploaded_file.name or "").lower()
    if not name.endswith(".pdf"):
        return Response({"file": "Seuls les fichiers PDF sont acceptés."}, status=status.HTTP_400_BAD_REQUEST)

    if getattr(uploaded_file, "size", 0) and uploaded_file.size > 15 * 1024 * 1024:
        return Response({"file": "Fichier trop volumineux (max 15 Mo)."}, status=status.HTTP_400_BAD_REQUEST)

    version_obj = add_new_file_version(doc, uploaded_file, request.user)
    return Response(
        {
            "document": TdrStDocumentReadSerializer(doc).data,
            "uploaded_version": version_obj.id,
        },
        status=status.HTTP_201_CREATED,
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def document_delete_view(request, id: int):
    doc = get_object_or_404(TdrStDocument, id=id)
    
    # Vérifier que l'utilisateur est le demandeur
    if doc.demandeur != request.user:
        return Response({"detail": "Seul le demandeur peut supprimer ce document."}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # Vérifier que le document est un brouillon
    if doc.statut != TdrStDocument.Statut.BROUILLON:
        return Response({"detail": "Seuls les brouillons peuvent être supprimés."},
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Supprimer les fichiers PDF associés
    for version in doc.versions_fichier.all():
        if version.fichier_pdf:
            version.fichier_pdf.delete(save=False)
        version.delete()
    
    doc.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)