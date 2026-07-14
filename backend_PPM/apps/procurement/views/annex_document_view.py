from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import StrictModelPermissions
from apps.procurement.models.annex_document import AnnexDocument
from apps.procurement.serializers.annex_document_serializer import (
    AnnexDocumentSerializer
)


class AnnexDocumentViewSet(viewsets.ModelViewSet):

    queryset = AnnexDocument.objects.all().order_by("-uploaded_at")

    serializer_class = AnnexDocumentSerializer

    permission_classes = [StrictModelPermissions]

    parser_classes = [
        MultiPartParser,
        FormParser
    ]

    def perform_create(self, serializer):
        serializer.save()