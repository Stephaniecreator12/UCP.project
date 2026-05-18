from rest_framework import serializers
from apps.procurement.models.atelier import (
    DateAtelier
)
class DateAtelierSerializer(serializers.ModelSerializer):
    date_atelier = serializers.DateTimeField(source='dates_atelier')
    class Meta:
        model = DateAtelier
        fields = ['id', 'date_atelier']