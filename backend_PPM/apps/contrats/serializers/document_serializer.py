from rest_framework import serializers

from apps.common.models import ChoiceGroup, reference_choices
from apps.common.serializers import DynamicChoiceField
from apps.contrats.models.document import DocumentContrat
from apps.contrats.models.enums import TypeDocumentContrat


class DocumentContratSerializer(serializers.ModelSerializer):

    type_document = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.DOCUMENT_TYPE_CONTRAT, TypeDocumentContrat.choices)
    )

    class Meta:
        model = DocumentContrat
        read_only_fields = (
            "hash_sha256",
            "date_upload",
        )

        fields = (
            "id",
            "type_document",
            "fichier",
            "hash_sha256",
            "date_upload",
        )

    def validate_fichier(self, fichier):

        if not fichier.name.lower().endswith(".pdf"):
            raise serializers.ValidationError(
                "Seuls les fichiers PDF sont autorisés."
            )

        return fichier