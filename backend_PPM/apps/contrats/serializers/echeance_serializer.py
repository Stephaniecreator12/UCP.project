from rest_framework import serializers

from apps.contrats.models.echeances import EcheancePaiement


class EcheancePaiementSerializer(serializers.ModelSerializer):

    class Meta:
        model = EcheancePaiement
        fields = (
            "id",
            "ordre",
            "libelle",
            "montant",
            "pourcentage",
            "date_prevue",
            "condition",
        )

    def validate_pourcentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError(
                "Le pourcentage doit être compris entre 0 et 100."
            )
        return value

    def validate_montant(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Le montant doit être supérieur à zéro."
            )
        return value