from django.urls import path

from apps.TdR_ST.views.document_view import (
    create_document_view,
    document_detail_view,
    my_documents_view,
    submit_document_view,
    upload_pdf_view,
)

urlpatterns = [
    path("documents/", create_document_view),
    path("documents/me/", my_documents_view),
    path("documents/<int:id>/", document_detail_view),
    path("documents/<int:id>/submit/", submit_document_view),
    path("documents/<int:id>/upload/", upload_pdf_view),
]

