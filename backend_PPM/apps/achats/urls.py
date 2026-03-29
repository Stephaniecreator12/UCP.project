from django.urls import path

from apps.achats.views.demande_view import (
    demande_detail_view,
    demande_list_create_view,
    demande_submit_view,
)
from apps.achats.views.validation_view import (
    demande_validate_view,
    pending_validations_view,
)

urlpatterns = [
    path("demandes/", demande_list_create_view, name="demande-list-create"),
    path("demandes/<int:demande_id>/", demande_detail_view, name="demande-detail"),
    path("demandes/<int:demande_id>/submit/", demande_submit_view, name="demande-submit"),
    path("validations/pending/", pending_validations_view, name="pending-validations"),
    path("demandes/<int:demande_id>/validate/", demande_validate_view, name="demande-validate"),
]
