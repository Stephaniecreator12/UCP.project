from rest_framework import serializers
from apps.log.models.consultation import LogConsultation
from apps.log.models.download import LogDownload
from apps.procurement.models.procurement_market import ProcurementMarket

class TrackActionSerializer(serializers.Serializer):
    ACTION_CHOICES = [
        ('VIEW', 'Consultation de la fiche'),
        ('DOWNLOAD_DAO', 'Téléchargement du DAO principal'),
        ('DOWNLOAD_ANNEXE', 'Téléchargement d\'une annexe'),
    ]
    
    dossier_id = serializers.IntegerField()
    user_id = serializers.CharField(max_length=64) 
    action_type = serializers.ChoiceField(choices=ACTION_CHOICES)
    annexe_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_dossier_id(self, value):
        if not ProcurementMarket.objects.filter(id=value).exists():
            raise serializers.ValidationError("Ce dossier n'existe pas.")
        return value

    def create(self, validated_data):
        action = validated_data['action_type']
        dossier = ProcurementMarket.objects.get(id=validated_data['dossier_id'])
        
        if action == 'VIEW':
            return LogConsultation.objects.create(
                dossier=dossier,
                user_id=int(validated_data['user_id']),
            )
        else:
            doc_type = 'DAO' if action == 'DOWNLOAD_DAO' else 'ANNEXE'
            return LogDownload.objects.create(
                dossier=dossier,
                user_id=int(validated_data['user_id']),
                doc_type=doc_type,
                annexe_name=validated_data.get('annexe_name', '')
            )
