from rest_framework import serializers
from apps.ppm.models.Biens import Biens

class BiensSerializer(serializers.ModelSerializer):
    class Meta:
        model = Biens
        fields = "__all__"
