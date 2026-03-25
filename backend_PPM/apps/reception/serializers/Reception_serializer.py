from apps.reception.models import Reception
from rest_framework import serializers
from apps.reception.models.Reception import Reception

class ReceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reception
        fields = "__all__"
