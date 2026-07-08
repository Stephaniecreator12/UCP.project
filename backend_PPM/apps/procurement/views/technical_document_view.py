from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import StrictModelPermissions
from apps.procurement.models.technical_document import TechnicalDocument
from apps.procurement.serializers.technical_document_serializer import (
    TechnicalDocumentSerializer
)


class TechnicalDocumentViewSet(viewsets.ModelViewSet):

    queryset = TechnicalDocument.objects.all().order_by("-uploaded_at")

    serializer_class = TechnicalDocumentSerializer

    permission_classes = [StrictModelPermissions]

    parser_classes = [
        MultiPartParser,
        FormParser
    ]

    def perform_create(self, serializer):
        serializer.save()