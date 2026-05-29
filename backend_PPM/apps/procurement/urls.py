from rest_framework.routers import DefaultRouter

from apps.procurement.views.procurement_market_view import (
    ProcurementMarketViewSet
)
from apps.procurement.views.technical_document_view import (
    TechnicalDocumentViewSet
)
from apps.procurement.views.annex_document_view import (
    AnnexDocumentViewSet
)

router = DefaultRouter()

router.register(
    r"markets",
    ProcurementMarketViewSet,
    basename="markets"
)

router.register(
    r"technical-documents",
    TechnicalDocumentViewSet,
    basename="technical-documents"
)

router.register(
    r"annexes",
    AnnexDocumentViewSet,
    basename="annexes"
)

urlpatterns = router.urls