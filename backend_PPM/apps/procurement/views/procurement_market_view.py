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
from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from apps.procurement.models.procurement_market import ProcurementMarket

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
            'technical_documents',
            'dates_previsionnelles'
        )




class DownloadDAOView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request, reference_number):
        market = get_object_or_404(ProcurementMarket, reference_number=reference_number)
        
        if not market.submission_model:
            raise Http404("Aucun fichier DAO disponible pour ce marché.")
        
        file_handle = market.submission_model.open()
        
        clean_ref = reference_number.replace('/', '-')
        filename = f"DAO_{clean_ref}.docx"
        
        response = FileResponse(file_handle, content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response