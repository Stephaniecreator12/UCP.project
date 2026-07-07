from rest_framework import serializers

from apps.contrats.models.enums import TypeDocumentContrat
from apps.contrats.models.document import DocumentContrat


class UploadContratSerializer(serializers.ModelSerializer):

    class Meta:
        model = DocumentContrat

        fields = (
            "type_document",
            "fichier",
        )

    def validate_fichier(self, value):

        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError(
                "Le contrat doit être au format PDF."
            )

        return value

    def validate_type_document(self, value):

        if value not in (
            TypeDocumentContrat.CONTRAT_SIGNE,
            TypeDocumentContrat.AVENANT,
        ):
            raise serializers.ValidationError("Type de document invalide.")

        return value