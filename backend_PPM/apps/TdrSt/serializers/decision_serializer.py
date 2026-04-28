from rest_framework import serializers

from apps.TdrSt.models.TdrSt import TdrStValidationAction


class TechDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(
        choices=[
            TdrStValidationAction.Decision.FAVORABLE,
            TdrStValidationAction.Decision.A_REVOIR,
        ]
    )
    observations = serializers.CharField(required=False, allow_blank=True)


class FinalDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(
        choices=[
            TdrStValidationAction.Decision.APPROUVE,
            TdrStValidationAction.Decision.REJETE,
        ]
    )
    observations = serializers.CharField(required=False, allow_blank=True)


class AnoDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(
        choices=[
            TdrStValidationAction.Decision.ANO_ACCORDE,
            TdrStValidationAction.Decision.ANO_REFUSE,
        ]
    )
    observations = serializers.CharField(required=False, allow_blank=True)
