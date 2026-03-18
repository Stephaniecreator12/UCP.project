from rest_framework import serializers
from apps.achats.models.demande_achat import DemandeAchat


class DemandeAchatSerializer(serializers.ModelSerializer):

    class Meta:
        model = DemandeAchat
        fields = "__all__"