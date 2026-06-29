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

<<<<<<< HEAD

class AnoDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(
        choices=[
            TdrStValidationAction.Decision.ANO_ACCORDE,
            TdrStValidationAction.Decision.ANO_REFUSE,
        ]
    )
    observations = serializers.CharField(required=False, allow_blank=True)
=======
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
