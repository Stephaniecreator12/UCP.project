from rest_framework import serializers
from django.utils import timezone

from apps.procurement.models.procurement_market import (
    ProcurementMarket,
    ProcedureType,
    FinancingSource
)

from apps.procurement.serializers.annex_document_serializer import AnnexDocumentSerializer
from apps.procurement.serializers.technical_document_serializer import TechnicalDocumentSerializer

class ProcurementMarketSerializer(serializers.ModelSerializer):

    technical_documents = (
        TechnicalDocumentSerializer(
            many=True,
            read_only=True
        )
    )

    annexes = (
        AnnexDocumentSerializer(
            many=True,
            read_only=True
        )
    )

    class Meta:
        model = ProcurementMarket

        fields = [
            "id",
            "reference_number",
            "title",
            "procedure_type",
            "category",
            "financing_source",
            "reference_bailleur",
            "project_code",
            "publication_date",
            "deadline",
            "status",
            "created_at",
            "submission_model",
            "technical_documents",
            "annexes"
        ]

        read_only_fields = [
            "reference_number",
            "publication_date",
            "created_at"
        ]
    def validate_reference_bailleur(self, value):

        valid_choices = [
            choice[0]
            for choice in FinancingSource.choices
        ]

        if not isinstance(value, list):
            raise serializers.ValidationError(
                "reference_bailleur doit être une liste."
            )

        for item in value:

            if item not in valid_choices:
                raise serializers.ValidationError(
                    f"{item} n'est pas un bailleur valide."
                )

        return value
    def validate_procedure_type(self, value):

        valid = [c[0] for c in ProcedureType.choices]

        if value not in valid:
            raise serializers.ValidationError(
                "procedure_type invalide"
            )

        return value
    def validate(self, attrs):

        procedure_type = attrs.get("procedure_type")
        deadline = attrs.get("deadline")

        publication_date = timezone.now()

        delta = deadline - publication_date
        if not deadline:
            raise serializers.ValidationError({
                "deadline": "obligatoire"
        })
        if(deadline <= publication_date):
            raise serializers.ValidationError({
                "deadline": "deadline supérieur à la date de publication"
        })

        if not procedure_type:
            raise serializers.ValidationError({
                "procedure_type": "obligatoire"
        })

        if (
            procedure_type == ProcedureType.AOI
            and delta.days < 15
        ):
            raise serializers.ValidationError({
                "deadline":
                "AOI : minimum 15 jours."
            })

        elif (
            procedure_type == ProcedureType.DC
            and delta.days < 10
        ):
            raise serializers.ValidationError({
                "deadline":
                "DC : minimum 10 jours."
            })

        financing_source = attrs.get(
            "financing_source"
        )

        reference_bailleur = attrs.get(
            "reference_bailleur",
            []
        )
        if reference_bailleur is None:
            reference_bailleur = []

        if (
                financing_source is not None
                and financing_source in reference_bailleur
            ):

            raise serializers.ValidationError({
                "reference_bailleur":
                (
                    "La source de financement principale "
                    "ne peut pas être dans "
                    "les bailleurs référents."
                )
            })

        return attrs