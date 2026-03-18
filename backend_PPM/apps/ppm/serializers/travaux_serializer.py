from rest_framework import serializers
from apps.ppm.models.travaux import Travaux

class TravauxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Travaux
        fields = "__all__"
