from rest_framework import serializers

from apps.achats.models.validation import ValidationDemande


class ValidationReadSerializer(serializers.ModelSerializer):
    validateur_username = serializers.CharField(source="validateur.username", read_only=True)
    validateur_nom = serializers.SerializerMethodField()
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    fonds_statut_display = serializers.SerializerMethodField()

    class Meta:
        model = ValidationDemande
        fields = [
            "id",
            "demande",
            "validateur",
            "validateur_username",
            "validateur_nom",
            "role",
            "role_display",
            "statut",
            "statut_display",
            "commentaire",
            "fonds_statut",
            "fonds_statut_display",
            "visa",
            "date_validation",
        ]

    def get_validateur_nom(self, obj):
        if not obj.validateur:
            return ""
        return obj.validateur.get_full_name() or obj.validateur.username

    def get_fonds_statut_display(self, obj):
        if not obj.fonds_statut:
            return ""
        return obj.get_fonds_statut_display()


class ValidationDecisionSerializer(serializers.Serializer):
    demande_id = serializers.IntegerField()
    decision = serializers.ChoiceField(
        choices=[
            ValidationDemande.STATUT_APPROUVE,
            ValidationDemande.STATUT_REJETE,
        ]
    )
    commentaire = serializers.CharField(required=False, allow_blank=True)
    fonds_statut = serializers.ChoiceField(
        choices=[
            ValidationDemande.FONDS_DISPONIBLES,
            ValidationDemande.FONDS_INSUFFISANTS,
        ],
        required=False,
        allow_null=True,
    )
    visa = serializers.CharField(required=False, allow_blank=True)
