from rest_framework import serializers

from apps.TdrSt.models.TdrSt import TdrStDocument, TdrStDocumentFileVersion, TdrStValidationAction


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
            "snapshot_data",
        ]
        read_only_fields = fields


class TdrStValidationActionSerializer(serializers.ModelSerializer):
    acteur_username = serializers.CharField(source="acteur.username", read_only=True)

    class Meta:
        model = TdrStValidationAction
        fields = [
            "id",
            "etape",
            "decision",
            "observations",
            "acteur",
            "acteur_username",
            "horodatage",
            "meta",
        ]
        read_only_fields = fields


class TdrStDocumentReadSerializer(serializers.ModelSerializer):
    demandeur_username = serializers.CharField(source="demandeur.username", read_only=True)
    versions_fichier = TdrStDocumentFileVersionSerializer(many=True, read_only=True)
    fichier_courant = TdrStDocumentFileVersionSerializer(read_only=True)
    actions_validation = serializers.SerializerMethodField()
    requires_ano = serializers.SerializerMethodField()

    def get_actions_validation(self, obj):
        actions = obj.actions_validation.select_related("acteur").all().order_by("-horodatage")
        return TdrStValidationActionSerializer(actions, many=True).data

    def get_requires_ano(self, obj) -> bool:
        # Centraliser la regle metier (inclut le fallback de seuil si `seuil_passation` est vide)
        from apps.TdrSt.services.TdrStService import requires_ano

        return bool(requires_ano(obj))

    class Meta:
        model = TdrStDocument
        fields = [
            "id",
            "numero_document",
            "version",
            "created_at",
            "updated_at",
            "demandeur",
            "demandeur_username",
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
            "requires_ano",
            "procedure_envisagee",
            "fichier_courant",
            "versions_fichier",
            "actions_validation",
        ]
