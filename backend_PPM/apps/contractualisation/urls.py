from django.urls import path
from . import views

app_name = "contractualisation"

urlpatterns = [
    # Contrats
    path("contrats/", views.contrats_list, name="contrats-list"),
    path("contrats/create/", views.contrats_create, name="contrats-create"),
    path("contrats/<int:contrat_id>/", views.contrats_detail, name="contrats-detail"),
    path("contrats/<int:contrat_id>/update/", views.contrats_update, name="contrats-update"),
    path("contrats/<int:contrat_id>/send/", views.contrats_send, name="contrats-send"),

    # Échéancier
    path("contrats/<int:contrat_id>/echeancier/", views.echeancier_add, name="echeancier-add"),

    # Documents
    path("contrats/<int:contrat_id>/upload/", views.document_upload, name="document-upload"),
    path(
        "contrats/<int:contrat_id>/documents/<int:document_id>/download/",
        views.document_download,
        name="document-download",
    ),
]
