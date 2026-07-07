from rest_framework import serializers

from apps.contrats.models.document import DocumentContrat


class DocumentContratSerializer(serializers.ModelSerializer):

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