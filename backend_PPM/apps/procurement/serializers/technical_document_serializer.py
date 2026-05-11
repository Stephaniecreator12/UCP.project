from rest_framework import serializers

from apps.procurement.models.technical_document import (
    TechnicalDocument
)


class TechnicalDocumentSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = TechnicalDocument

        fields = [
            "id",
            "market",
            "file",
            "version",
            "uploaded_at"
        ]

        read_only_fields = [
            "version",
            "uploaded_at"
        ]