from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.contrats.views.contrats_view import ContratViewSet

router = DefaultRouter()

router.register(
    r"contrats",
    ContratViewSet,
    basename="contrat"
)

urlpatterns = [
    path("", include(router.urls)),
]