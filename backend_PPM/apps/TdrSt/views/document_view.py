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
<<<<<<< HEAD
=======
from apps.TdrSt.services.schema_compat import (
    MISSING_TDR_LINK_MIGRATION_MESSAGE,
    has_tdr_demande_link_column,
)
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
from apps.TdrSt.services.TdrStService import (
    create_document,
    list_my_documents,
    submit_document,
    suspendre_document,
    update_document,
)


<<<<<<< HEAD
@api_view(["POST"])
@permission_classes([IsAuthenticated, CanCreateDocument])
def create_document_view(request):
=======
def _missing_link_response():
    return Response(
        {"detail": MISSING_TDR_LINK_MIGRATION_MESSAGE},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated, CanCreateDocument])
def create_document_view(request):
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    serializer = TdrStDocumentWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    doc = create_document(serializer.validated_data, request.user)
    return Response(TdrStDocumentReadSerializer(doc).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanListMyDocuments])
def my_documents_view(request):
<<<<<<< HEAD
=======
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    docs = list_my_documents(request.user)
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def document_detail_view(request, id: int):
<<<<<<< HEAD
=======
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    doc = get_object_or_404(TdrStDocument, id=id)
    perm = CanReadDocument()
    if not perm.has_object_permission(request, None, doc):
        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        return Response(TdrStDocumentReadSerializer(doc).data)

<<<<<<< HEAD
    # PATCH: only initiateur can edit in BROUILLON / A_REVOIR (enforced in service).
=======
    # PATCH: only demandeur can edit in BROUILLON / A_REVOIR (enforced in service).
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    serializer = TdrStDocumentWriteSerializer(doc, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    doc = update_document(doc, serializer.validated_data, request.user)
    return Response(TdrStDocumentReadSerializer(doc).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_document_view(request, id: int):
<<<<<<< HEAD
    doc = get_object_or_404(TdrStDocument, id=id)
    # Vérifier que l'utilisateur est l'initiateur
    if doc.initiateur != request.user:
        return Response({"detail": "Seul l'initiateur peut soumettre ce document."}, 
=======
    if not has_tdr_demande_link_column():
        return _missing_link_response()

    doc = get_object_or_404(TdrStDocument, id=id)
    # Vérifier que l'utilisateur est le demandeur
    if doc.demandeur != request.user:
        return Response({"detail": "Seul le demandeur peut soumettre ce document."}, 
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
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
<<<<<<< HEAD
=======
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
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

<<<<<<< HEAD
=======
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
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
