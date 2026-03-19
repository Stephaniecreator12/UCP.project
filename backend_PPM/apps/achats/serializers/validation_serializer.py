from rest_framework import serializers
from apps.achats.models.validation import ValidationDemande


class ValidationSerializer(serializers.ModelSerializer):

    class Meta:

        model = ValidationDemande

        fields = "__all__"

        read_only_fields = [
            "validateur",
            "date_validation"
        ]