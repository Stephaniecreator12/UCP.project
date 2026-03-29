from rest_framework import serializers

from apps.achats.models import ValidationDemande


class ValidationDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=ValidationDemande.DECISION_CHOICES)
    commentaire = serializers.CharField(required=False, allow_blank=True)
