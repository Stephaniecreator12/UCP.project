from rest_framework import viewsets
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser
)

from apps.procurement.models.procurement_market import (
    ProcurementMarket
)

from apps.procurement.serializers.procurement_market_serializer import (
    ProcurementMarketSerializer
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