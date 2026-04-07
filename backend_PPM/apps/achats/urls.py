from django.urls import path

from apps.achats.views.demande_view import (
    demande_close_view,
    demande_detail_view,
    demande_issue_order_view,
    demande_document_upload_view,
    demande_list_create_view,
    demande_receive_view,
    demande_submit_view,
    demande_update_delivery_view,
    passation_pending_view,
)
from apps.achats.views.validation_view import (
    demande_validate_view,
    pending_validations_view,
)

urlpatterns = [
    path("demandes/", demande_list_create_view, name="demande-list-create"),
    path("passation/pending/", passation_pending_view, name="passation-pending"),
    path("demandes/<int:demande_id>/", demande_detail_view, name="demande-detail"),
    path("demandes/<int:demande_id>/documents/", demande_document_upload_view, name="demande-document-upload"),
    path("demandes/<int:demande_id>/submit/", demande_submit_view, name="demande-submit"),
    path("demandes/<int:demande_id>/issue-order/", demande_issue_order_view, name="demande-issue-order"),
    path("demandes/<int:demande_id>/delivery/", demande_update_delivery_view, name="demande-delivery"),
    path("demandes/<int:demande_id>/receive/", demande_receive_view, name="demande-receive"),
    path("demandes/<int:demande_id>/close/", demande_close_view, name="demande-close"),
    path("validations/pending/", pending_validations_view, name="pending-validations"),
    path("demandes/<int:demande_id>/validate/", demande_validate_view, name="demande-validate"),
]
