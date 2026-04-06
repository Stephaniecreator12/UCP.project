from django.urls import path

from apps.TdrSt.views.document_view import (
    create_document_view,
    document_detail_view,
    my_documents_view,
    submit_document_view,
    suspend_document_view,
    upload_pdf_view,
)
from apps.TdrSt.views.validation_view import (
    bailleur_documents_view,
    bailleur_decision_view,
    final_decision_view,
    final_pending_view,
    tech_decision_view,
    tech_pending_view,
)

urlpatterns = [
    path("documents/", create_document_view),
    path("documents/me/", my_documents_view),
    path("documents/<int:id>/", document_detail_view),
    path("documents/<int:id>/submit/", submit_document_view),
    path("documents/<int:id>/upload/", upload_pdf_view),
    path("documents/<int:id>/suspend/", suspend_document_view),

    # Validation workflow (role-based views)
    path("validations/tech/pending/", tech_pending_view),
    path("validations/tech/<int:id>/decision/", tech_decision_view),
    path("validations/final/pending/", final_pending_view),
    path("validations/final/<int:id>/decision/", final_decision_view),
    path("bailleur/documents/", bailleur_documents_view),
    path("bailleur/<int:id>/decision/", bailleur_decision_view),
]
