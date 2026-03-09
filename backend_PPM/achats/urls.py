from rest_framework.routers import DefaultRouter

from .views import DemandeAchatViewSet

router = DefaultRouter()
router.register(r'achats', DemandeAchatViewSet, basename='demande-achat')

urlpatterns = router.urls
