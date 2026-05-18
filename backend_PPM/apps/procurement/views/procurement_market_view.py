from rest_framework import viewsets
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser
)
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.pagination import PageNumberPagination
from apps.procurement.models.procurement_market import (
    ProcurementMarket
)

from apps.procurement.serializers.procurement_market_serializer import (
    ProcurementMarketSerializer,
    ProcurementMarketListSerializer
)
from rest_framework.permissions import IsAuthenticated


class ProcurementMarketViewSet(viewsets.ModelViewSet):

    queryset = ProcurementMarket.objects.all().order_by(
        "-created_at"
    )

    serializer_class = ProcurementMarketSerializer

    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser
    ]
    def perform_create(self, serializer):
        serializer.save()

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProcurementMarketListViewSet(ReadOnlyModelViewSet):
    serializer_class = ProcurementMarketListSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return ProcurementMarket.objects.all().prefetch_related(
            'annexes',
            'technical_documents'
        )