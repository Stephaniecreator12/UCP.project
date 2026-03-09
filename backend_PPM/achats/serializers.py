from rest_framework import serializers
from .models import DemandeAchat

class DemandeAchatSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeAchat
        fields = '__all__'
