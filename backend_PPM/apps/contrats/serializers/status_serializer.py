from rest_framework import serializers

from apps.contrats.models.enums import ContratStatut


class ChangerStatutContratSerializer(serializers.Serializer):

    statut = serializers.ChoiceField(
        choices=ContratStatut.choices
    )