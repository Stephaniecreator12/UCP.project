# contracts/serializers/contrat.py

from rest_framework import serializers

from apps.common.models import ChoiceGroup, reference_choices
from apps.common.serializers import DynamicChoiceField
from apps.contrats.models.contrats import Contrat
from apps.contrats.models.echeances import EcheancePaiement
from apps.contrats.models.enums import ContratStatut
from apps.contrats.serializers.document_serializer import DocumentContratSerializer
from apps.contrats.serializers.echeance_serializer import EcheancePaiementSerializer
from apps.contrats.serializers.audit_serializer import ContratAuditSerializer


class ContratSerializer(serializers.ModelSerializer):

    statut = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.CONTRAT_STATUT, ContratStatut.choices),
        required=False
    )

    echeances = EcheancePaiementSerializer(
        many=True,
        read_only=True
    )

    documents = DocumentContratSerializer(
        many=True,
        read_only=True
    )

    audit_logs = ContratAuditSerializer(
        many=True,
        read_only=True
    )

    class Meta:

        model = Contrat

        fields = (
            "id",
            "numero_marche",
            "projet",
            "prestataire_id",
            "montant_ttc",
            "date_signature",
            "duree_execution",
            "clauses_particulieres",
            "representant_signataire",
            "fonction_signataire",
            "statut",
            "echeances",
            "documents",
            "audit_logs",
            "date_creation",
            "date_modification",
        )

class ContratCreateUpdateSerializer(serializers.ModelSerializer):

    statut = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.CONTRAT_STATUT, ContratStatut.choices),
        required=False
    )

    echeances = EcheancePaiementSerializer(
        many=True,
        required=False
    )

    class Meta:

        model = Contrat

        fields = (
            "numero_marche",
            "projet",
            "prestataire_id",
            "montant_ttc",
            "date_signature",
            "duree_execution",
            "clauses_particulieres",
            "representant_signataire",
            "fonction_signataire",
            "statut",
            "echeances",
        )

    def create(self, validated_data):

        echeances = validated_data.pop("echeances", [])

        contrat = Contrat.objects.create(**validated_data)

        for echeance in echeances:
            EcheancePaiement.objects.create(
                contrat=contrat,
                **echeance
            )

        return contrat

    def update(self, instance, validated_data):

        echeances = validated_data.pop("echeances", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if echeances is not None:

            instance.echeances.all().delete()

            for echeance in echeances:
                EcheancePaiement.objects.create(
                    contrat=instance,
                    **echeance
                )

        return instance