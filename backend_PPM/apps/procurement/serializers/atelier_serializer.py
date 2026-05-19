from rest_framework import serializers
from apps.procurement.models.atelier import (
    DateAtelier
)
class DateAtelierSerializer(serializers.ModelSerializer):
    class Meta:
        model = DateAtelier
        fields = ['id', 'dates_atelier']