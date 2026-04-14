from rest_framework import serializers


class MonthlyDocumentsSerializer(serializers.Serializer):
    month = serializers.CharField()
    count = serializers.IntegerField()


class DocumentTypeSerializer(serializers.Serializer):
    name = serializers.CharField()
    value = serializers.IntegerField()
    color = serializers.CharField(required=False, allow_blank=True)


class DocumentSourceSerializer(serializers.Serializer):
    source = serializers.CharField()
    documents = serializers.IntegerField()
    fullMark = serializers.IntegerField()


class KPIsSerializer(serializers.Serializer):
    current_month = serializers.DictField(child=serializers.IntegerField())
    avg_delay = serializers.DictField()
    validated = serializers.DictField(child=serializers.IntegerField())
    pending = serializers.DictField(child=serializers.IntegerField())


class DashboardStatsSerializer(serializers.Serializer):
    total_documents_year = serializers.IntegerField()
    validation_rate = serializers.FloatField()
    financement_sources_count = serializers.IntegerField()
    monthly_documents = MonthlyDocumentsSerializer(many=True)
    documents_by_type = DocumentTypeSerializer(many=True)
    documents_by_source = DocumentSourceSerializer(many=True)
    kpis = KPIsSerializer()


class TopUnitSerializer(serializers.Serializer):
    unite = serializers.CharField()
    total = serializers.IntegerField()
    rejected = serializers.IntegerField()
    rate = serializers.FloatField()


class MonthlyCountSerializer(serializers.Serializer):
    label = serializers.CharField()
    count = serializers.IntegerField()


class AuditeurOverviewSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    rejected = serializers.IntegerField()
    rejected_rate = serializers.FloatField()
    requires_ano = serializers.IntegerField()
    with_ano_action = serializers.IntegerField()
    avg_delay_days = serializers.FloatField(allow_null=True)
    monthly = MonthlyCountSerializer(many=True)
    top_units = TopUnitSerializer(many=True)


class DashboardResponseSerializer(serializers.Serializer):
    role = serializers.CharField()
    stats = DashboardStatsSerializer()
    auditeur_overview = AuditeurOverviewSerializer(required=False, allow_null=True)