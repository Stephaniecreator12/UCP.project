from django.urls import path

from .views import (
    available_users,
    seance_detail,
    seance_list_create,
    seance_reject_member,
    seance_reject_president,
    seance_validation_access,
    seance_validation_decision,
    seance_validate_member,
    seance_validate_president,
    download_pv,
)

urlpatterns = [
    path("utilisateurs/", available_users, name="ouverture-users"),
    path("seances/", seance_list_create, name="ouverture-seances"),
    path("seances/<int:pk>/", seance_detail, name="ouverture-seance-detail"),
    path("seances/<int:pk>/validation-acces/", seance_validation_access, name="ouverture-seance-validation-acces"),
    path("seances/<int:pk>/validation-decision/", seance_validation_decision, name="ouverture-seance-validation-decision"),
    path("seances/<int:pk>/valider-membre/", seance_validate_member, name="ouverture-seance-valider-membre"),
    path("seances/<int:pk>/rejeter-membre/", seance_reject_member, name="ouverture-seance-rejeter-membre"),
    path("seances/<int:pk>/valider-president/", seance_validate_president, name="ouverture-seance-valider-president"),
    path("seances/<int:pk>/rejeter-president/", seance_reject_president, name="ouverture-seance-rejeter-president"),
    path("seances/<int:pk>/telecharger-pv/", download_pv, name="ouverture-seance-telecharger-pv"),
]
