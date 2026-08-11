from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
import json
from apps.common.models import ChoiceGroup, reference_codes, reference_choices
from apps.common.serializers import DynamicChoiceField
from apps.procurement.models.procurement_market import (
    ProcurementMarket,
    ProcedureType,
    CategoryType,
    PublicationStatus,
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

    procedure_type = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.PROCEDURE_TYPE, ProcedureType.choices)
    )
    category = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.CATEGORY_TYPE, CategoryType.choices)
    )
    reference_bailleur = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.FINANCING_SOURCE, FinancingSource.choices),
        required=False,
        allow_null=True,
        allow_blank=True
    )
    status = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.PUBLICATION_STATUS, PublicationStatus.choices),
        required=False
    )

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
    dates_atelier = serializers.ListField(
        child=serializers.DateTimeField(),
        write_only=True,
        required=False
    )

    dates_atelier_details = DateAtelierSerializer(
        many=True,
        read_only=True,
        source='dates_previsionnelles'
    )
    deletedAnnexIds = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    deletedTechnicalDocumentIds = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

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
            "annexes",
            "dates_atelier_details",
            "deletedAnnexIds",
            "deletedTechnicalDocumentIds",
        ]

        read_only_fields = [
            "reference_number",
            "created_at"
        ]
    
    def validate_financing_sources(
        self,
        value
    ):

        if not isinstance(value, list):
            raise serializers.ValidationError(
                "financing_sources doit être une liste."
            )

        valid_choices = reference_codes(
            ChoiceGroup.FINANCING_SOURCE,
            FinancingSource.choices,
        )

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

        valid_choices = reference_codes(
            ChoiceGroup.FINANCING_SOURCE,
            FinancingSource.choices,
        )

        if value not in valid_choices:

            raise serializers.ValidationError(
                "Bailleur référent invalide."
            )

        return value

    def validate_procedure_type(self, value):

        valid = reference_codes(
            ChoiceGroup.PROCEDURE_TYPE,
            ProcedureType.choices,
        )

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
        dates_atelier = attrs.get("dates_atelier", None)

        is_create = self.instance is None

        if is_create:
            if category == "SERVICES" and not dates_atelier:
                raise serializers.ValidationError({
                    "dates_atelier": "obligatoire"
                })
    #je desactive ca juste pour tester mon module ouverture offre sur le deadline
    #    if(publication_date < timezone.now()):
     #            "publication_date": "publication_date supérieur à la date actuelle"
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
            
            for date_value in dates_data:
                DateAtelier.objects.create(
                    market=procurement_market, 
                    dates_atelier=date_value
                )
                
            return procurement_market
    
    @transaction.atomic
    def update(self, instance, validated_data):
        dates_data = validated_data.pop("dates_atelier", None)
        deleted_annex_ids = validated_data.pop("deletedAnnexIds", [])
        deleted_technical_documents_ids = validated_data.pop("deletedTechnicalDocumentIds", [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        if deleted_annex_ids:
            print("annexes envoye")
            for annex in instance.annexes.filter(id__in=deleted_annex_ids):
                annex.file.delete(save=False)
                annex.delete()
        else:
            print("aucun annexe")
        if deleted_technical_documents_ids:
            print("documents envoye")
            for document in instance.technical_documents.filter(id__in=deleted_technical_documents_ids):
                document.file.delete(save=False)
                document.delete()
        else:
            print("aucun document")

        if dates_data is not None:
            instance.dates_previsionnelles.all().delete()

            for date_value in dates_data:
                DateAtelier.objects.create(
                    market=instance,
                    dates_atelier=date_value
                )

        return instance
    


class ProcurementMarketListSerializer(serializers.ModelSerializer):
    procedure_type = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.PROCEDURE_TYPE, ProcedureType.choices)
    )
    category = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.CATEGORY_TYPE, CategoryType.choices)
    )
    reference_bailleur = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.FINANCING_SOURCE, FinancingSource.choices),
        required=False,
        allow_null=True,
        allow_blank=True
    )
    status = DynamicChoiceField(
        choices=lambda: reference_choices(ChoiceGroup.PUBLICATION_STATUS, PublicationStatus.choices),
        required=False
    )
    annexes = AnnexDocumentListSerializer(many=True, read_only=True)
    technical_documents = TechnicalDocumentListSerializer(many=True, read_only=True)
    dates_atelier_details = DateAtelierSerializer(many=True, read_only=True, source='dates_previsionnelles')

    class Meta:
        model = ProcurementMarket
        fields = [
            'id', 'reference_number', 'title', 'procedure_type', 
            'category', 'financing_sources', 'reference_bailleur', 
            'project_code', 'publication_date', 'deadline', "dates_atelier_details",
            'submission_model', 'status', 'created_at', 
            'annexes', 'technical_documents'
        ]