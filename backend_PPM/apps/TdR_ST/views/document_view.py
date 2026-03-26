from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.TdR_ST.models.TdR_ST import TdrStDocument
from apps.TdR_ST.serializers.document_serializer import (
    TdrStDocumentReadSerializer,
    TdrStDocumentWriteSerializer,
)
from apps.TdR_ST.services.TdrStService import create_document, list_my_documents, submit_document


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_document_view(request):
    serializer = TdrStDocumentWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    doc = create_document(serializer.validated_data, request.user)
    return Response(TdrStDocumentReadSerializer(doc).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_documents_view(request):
    docs = list_my_documents(request.user)
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def document_detail_view(request, id: int):
    doc = get_object_or_404(TdrStDocument, id=id)
    return Response(TdrStDocumentReadSerializer(doc).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_document_view(request, id: int):
    doc = get_object_or_404(TdrStDocument, id=id)
    doc = submit_document(doc, request.user)
    return Response(TdrStDocumentReadSerializer(doc).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_pdf_view(request, id: int):
    from apps.TdR_ST.services.TdrStService import add_new_file_version

    doc = get_object_or_404(TdrStDocument, id=id)
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

