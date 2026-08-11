from rest_framework import serializers

from apps.common.models import ChoiceGroup, reference_choices
from apps.common.serializers import DynamicChoiceField
from apps.contrats.models.enums import ContratStatut


class ChangerStatutContratSerializer(serializers.Serializer):

    statut = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.CONTRAT_STATUT, ContratStatut.choices)
    )