from django_filters import rest_framework as django_filters
from apps.procurement.models.procurement_market import ProcurementMarket

class ProcurementMarketDateFilter(django_filters.FilterSet):
    publish_after = django_filters.DateFilter(field_name="publication_date", lookup_expr="date__gte")
    publish_before = django_filters.DateFilter(field_name="publication_date", lookup_expr="date__lte")
    
    deadline_after = django_filters.DateFilter(field_name="deadline", lookup_expr="date__gte")
    deadline_before = django_filters.DateFilter(field_name="deadline", lookup_expr="date__lte")

    class Meta:
        model = ProcurementMarket
        fields = ['publish_after', 'publish_before', 'deadline_after', 'deadline_before']