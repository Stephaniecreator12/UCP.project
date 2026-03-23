from rest_framework import serializers

from apps.achats.models.demande_achat import DemandeAchat
from apps.achats.serializers.validation_serializer import ValidationReadSerializer
from apps.achats.serializers.workflow_history_serializer import WorkflowHistorySerializer


class DemandeAchatWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeAchat
        fields = [
            "service_demandeur",
            "fonction_demandeur",
            "activite_ptba",
            "indicateur_performance",
            "source_financement",
            "ligne_budgetaire",
            "budget_estime",
            "devise",
            "type_marche",
            "nature_activite",
            "objet_demande",
            "description",
            "pieces_jointes",
            "region",
            "adresse_livraison",
            "date_debut",
            "date_fin",
            "urgent",
            "justification_urgence",
        ]

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        def value_of(field_name):
            if field_name in attrs:
                return attrs[field_name]
            if instance is not None:
                return getattr(instance, field_name, None)
            return None

        date_debut = value_of("date_debut")
        date_fin = value_of("date_fin")
        if date_debut and date_fin and date_fin < date_debut:
            raise serializers.ValidationError(
                {"date_fin": "La date de fin doit être postérieure ou égale à la date de début."}
            )

        urgent = value_of("urgent")
        justification_urgence = value_of("justification_urgence")
        if urgent and not justification_urgence:
            raise serializers.ValidationError(
                {"justification_urgence": "Ce champ est obligatoire si la demande est urgente."}
            )

        return attrs


class DemandeAchatReadSerializer(serializers.ModelSerializer):
    demandeur_username = serializers.CharField(source="demandeur.username", read_only=True)
    demandeur_nom = serializers.SerializerMethodField()
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    validations = ValidationReadSerializer(many=True, read_only=True)
    workflow_history = WorkflowHistorySerializer(many=True, read_only=True)

    class Meta:
        model = DemandeAchat
        fields = [
            "id",
            "numero_demande",
            "date_demande",
            "service_demandeur",
            "demandeur",
            "demandeur_username",
            "demandeur_nom",
            "fonction_demandeur",
            "activite_ptba",
            "indicateur_performance",
            "source_financement",
            "ligne_budgetaire",
            "budget_estime",
            "devise",
            "type_marche",
            "nature_activite",
            "objet_demande",
            "description",
            "pieces_jointes",
            "region",
            "adresse_livraison",
            "date_debut",
            "date_fin",
            "urgent",
            "justification_urgence",
            "statut",
            "statut_display",
            "date_transmission_marches",
            "created_at",
            "updated_at",
            "validations",
            "workflow_history",
        ]

    def get_demandeur_nom(self, obj):
        if not obj.demandeur:
            return ""
        return obj.demandeur.get_full_name() or obj.demandeur.username
