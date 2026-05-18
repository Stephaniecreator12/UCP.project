from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
import json
from apps.procurement.models.procurement_market import (
    ProcurementMarket,
    ProcedureType,
    FinancingSource
)
from apps.procurement.models.atelier import (
    DateAtelier
)
from apps.procurement.serializers.atelier_serializer import (
    DateAtelierSerializer
)
from apps.procurement.serializers.annex_document_serializer import (
    AnnexDocumentSerializer,
    AnnexDocumentListSerializer
)
from apps.procurement.serializers.technical_document_serializer import (
    TechnicalDocumentSerializer,
    TechnicalDocumentListSerializer
)

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
    dates_atelier = DateAtelierSerializer(many=True, required=False)

    class Meta:
        model = ProcurementMarket

        fields = [
            "id",
            "reference_number",
            "title",
            "procedure_type",
            "category",
            "financing_sources",
            "reference_bailleur",
            "project_code",
            "publication_date",
            "deadline",
            "status",
            "created_at",
            "submission_model",
            "dates_atelier",
            "technical_documents",
            "annexes"
        ]

        read_only_fields = [
            "reference_number",
            "created_at"
        ]
    def to_internal_value(self, data):
        if hasattr(data, 'dict'):
            modified_data = data.copy()
        else:
            modified_data = dict(data)

        if 'dates_atelier' in modified_data:
            val = modified_data['dates_atelier']
            if isinstance(val, str):
                try:
                    modified_data['dates_atelier'] = json.loads(val)
                except json.JSONDecodeError:
                    pass

        return super().to_internal_value(modified_data)
    
    def validate_financing_sources(
        self,
        value
    ):

        if not isinstance(value, list):
            raise serializers.ValidationError(
                "financing_sources doit être une liste."
            )

        valid_choices = [
            choice[0]
            for choice
            in FinancingSource.choices
        ]

        for item in value:

            if item not in valid_choices:

                raise serializers.ValidationError(
                    f"{item} n'est pas une source valide."
                )

        return value
    def validate_reference_bailleur(
        self,
        value
    ):

        if value is None:
            return value

        valid_choices = [
            choice[0]
            for choice
            in FinancingSource.choices
        ]

        if value not in valid_choices:

            raise serializers.ValidationError(
                "Bailleur référent invalide."
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

        publication_date = attrs.get("publication_date")
        category = attrs.get("category")
        if not publication_date:
            raise serializers.ValidationError({
                "publication_date": "obligatoire"
        })
        dates_atelier = attrs.get("dates_atelier", [])
        if(category == "SERVICES" and not dates_atelier):
            raise serializers.ValidationError({
                "dates_atelier": "obligatoire"
        })
        if(publication_date < timezone.now()):
            raise serializers.ValidationError({
                "publication_date": "publication_date supérieur à la date actuelle"
        })
        delta = deadline - publication_date
        if not deadline:
            raise serializers.ValidationError({
                "deadline": "obligatoire"
        })
        if(deadline < publication_date):
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

        financing_sources = attrs.get(
            "financing_sources",
            []
        )

        reference_bailleur = attrs.get(
            "reference_bailleur"
        )
        project_code = attrs.get(
            "project_code"
        )
        
        if (
            len(financing_sources) > 1
            and not reference_bailleur
        ):

            raise serializers.ValidationError({
                "reference_bailleur":
                (
                    "Un bailleur référent "
                    "est obligatoire "
                    "si plusieurs sources "
                    "sont sélectionnées."
                )
            })

        if (
            reference_bailleur
            and reference_bailleur
            not in financing_sources
        ):

            raise serializers.ValidationError({
                "reference_bailleur":
                (
                    "Le bailleur référent "
                    "doit faire partie "
                    "des sources sélectionnées."
                )
            })
        if (
            financing_sources and
            not project_code
        ):

            raise serializers.ValidationError({
                "project_code":
                (
                    "Le code projet "
                    "est obligatoire "
                )
            })


        return attrs
    
@transaction.atomic
def create(self, validated_data):
        dates_data = validated_data.pop('dates_atelier', [])
        
        procurement_market = ProcurementMarket.objects.create(**validated_data)
        
        for date_item in dates_data:
            DateAtelier.objects.create(
                market=procurement_market, 
                **date_item
            )
            
        return procurement_market
class ProcurementMarketListSerializer(serializers.ModelSerializer):
    annexes = AnnexDocumentListSerializer(many=True, read_only=True)
    technical_documents = TechnicalDocumentListSerializer(many=True, read_only=True)
    dates_atelier = DateAtelierSerializer(many=True, read_only=True)

    class Meta:
        model = ProcurementMarket
        fields = [
            'id', 'reference_number', 'title', 'procedure_type', 
            'category', 'financing_sources', 'reference_bailleur', 
            'project_code', 'publication_date', 'deadline', "dates_atelier",
            'submission_model', 'status', 'created_at', 
            'annexes', 'technical_documents'
        ]