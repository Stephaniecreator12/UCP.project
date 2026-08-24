from django.urls import path
from . import views

app_name = "contractualisation"

urlpatterns = [
    # Contrats
    path("", views.contrats_list, name="contrats-list"),
    path("create/", views.contrats_create, name="contrats-create"),
    path("<int:contrat_id>/", views.contrats_detail, name="contrats-detail"),
    path("<int:contrat_id>/update/", views.contrats_update, name="contrats-update"),
    path("<int:contrat_id>/send/", views.contrats_send, name="contrats-send"),

    # Échéancier
    path("<int:contrat_id>/echeancier/", views.echeancier_add, name="echeancier-add"),
    path("<int:contrat_id>/echeancier/<int:echeancier_id>/", views.echeancier_detail, name="echeancier-detail"),

    # Documents
    path("<int:contrat_id>/upload/", views.document_upload, name="document-upload"),
    path(
        "<int:contrat_id>/documents/<int:document_id>/download/",
        views.document_download,
        name="document-download",
    ),
    path(
        "<int:contrat_id>/documents/<int:document_id>/",
        views.document_delete,
        name="document-delete",
    ),
]
