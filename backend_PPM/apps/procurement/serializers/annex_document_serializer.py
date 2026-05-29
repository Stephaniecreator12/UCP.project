from rest_framework import serializers

from apps.procurement.models.annex_document import (
    AnnexDocument
)


class AnnexDocumentSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = AnnexDocument

        fields = [
            "id",
            "market",
            "file",
            "uploaded_at"
        ]

        read_only_fields = [
            "uploaded_at"
        ]

    def validate(self, attrs):

        market = attrs.get("market")

        annex_count = market.annexes.count()

        if annex_count >= 5:

            raise serializers.ValidationError(
                "Maximum 5 annexes autorisées."
            )

        return attrs