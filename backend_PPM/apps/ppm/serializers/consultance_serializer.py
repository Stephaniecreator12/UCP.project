from rest_framework import serializers
from apps.common.models import ChoiceGroup, reference_codes, reference_choices
from apps.common.serializers import DynamicChoiceField
from apps.ppm.models.Consultances import Consultance, FinancingSource


class ConsultanceSerializer(serializers.ModelSerializer):
    reference_bailleur = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.FINANCING_SOURCE, FinancingSource.choices),
        required=False,
        allow_null=True,
        allow_blank=True,
    )

    class Meta:
        model = Consultance
        fields = "__all__"

    def validate_financing_sources(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("financing_sources doit être une liste.")
        valid_choices = reference_codes(ChoiceGroup.FINANCING_SOURCE, FinancingSource.choices)
        for item in value:
            if item not in valid_choices:
                raise serializers.ValidationError(f"{item} n'est pas une source valide.")
        return value

    def validate_reference_bailleur(self, value):
        if value is None or value == "":
            return value
        valid_choices = reference_codes(ChoiceGroup.FINANCING_SOURCE, FinancingSource.choices)
        if value not in valid_choices:
            raise serializers.ValidationError("Bailleur référent invalide.")
        return value

    def validate(self, attrs):
        financing_sources = attrs.get("financing_sources", [])
        reference_bailleur = attrs.get("reference_bailleur")
        project_code = attrs.get("project_code")

        if financing_sources and len(financing_sources) > 1 and not reference_bailleur:
            raise serializers.ValidationError({
                "reference_bailleur": "Un bailleur référent est obligatoire si plusieurs sources sont sélectionnées."
            })
        if reference_bailleur and financing_sources and reference_bailleur not in financing_sources:
            raise serializers.ValidationError({
                "reference_bailleur": "Le bailleur référent doit faire partie des sources sélectionnées."
            })
        if financing_sources and not project_code:
            raise serializers.ValidationError({
                "project_code": "Le code projet est obligatoire lorsque des sources de financement sont renseignées."
            })
        return attrs
