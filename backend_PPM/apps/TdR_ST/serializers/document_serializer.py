from rest_framework import serializers

from apps.TdR_ST.models.TdR_ST import TdrStDocument, TdrStDocumentFileVersion


class TdrStDocumentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TdrStDocument
        fields = [
            "unite_technique",
            "type_document",
            "categorie_activite",
            "intitule",
            "reference_ptba",
            "periode_debut",
            "periode_fin",
            "duree_estimee_valeur",
            "duree_estimee_unite",
            "sources_financement",
            "numero_subvention",
            "ligne_budgetaire",
            "montant_estime_usd",
            "procedure_envisagee",
        ]

    def validate(self, attrs):
        periode_debut = attrs.get("periode_debut")
        periode_fin = attrs.get("periode_fin")
        if periode_debut and periode_fin and periode_fin < periode_debut:
            raise serializers.ValidationError(
                {"periode_fin": "La date de fin doit être postérieure ou égale à la date de début."}
            )
        return attrs


class TdrStDocumentFileVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TdrStDocumentFileVersion
        fields = [
            "id",
            "version",
            "fichier_pdf",
            "fichier_nom_original",
            "fichier_taille_octets",
            "empreinte_sha256",
            "uploaded_by",
            "uploaded_at",
        ]
        read_only_fields = fields


class TdrStDocumentReadSerializer(serializers.ModelSerializer):
    initiateur_username = serializers.CharField(source="initiateur.username", read_only=True)
    versions_fichier = TdrStDocumentFileVersionSerializer(many=True, read_only=True)
    fichier_courant = TdrStDocumentFileVersionSerializer(read_only=True)

    class Meta:
        model = TdrStDocument
        fields = [
            "id",
            "numero_document",
            "version",
            "created_at",
            "updated_at",
            "initiateur",
            "initiateur_username",
            "unite_technique",
            "statut",
            "type_document",
            "categorie_activite",
            "intitule",
            "reference_ptba",
            "periode_debut",
            "periode_fin",
            "duree_estimee_valeur",
            "duree_estimee_unite",
            "sources_financement",
            "numero_subvention",
            "ligne_budgetaire",
            "montant_estime_usd",
            "seuil_passation",
            "procedure_envisagee",
            "fichier_courant",
            "versions_fichier",
        ]

