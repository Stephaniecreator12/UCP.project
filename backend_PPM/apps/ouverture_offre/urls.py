from django.urls import path

from .views import available_users, seance_detail, seance_list_create, seance_validate_member, seance_validate_president

urlpatterns = [
    path("utilisateurs/", available_users, name="ouverture-users"),
    path("seances/", seance_list_create, name="ouverture-seances"),
    path("seances/<int:pk>/", seance_detail, name="ouverture-seance-detail"),
    path("seances/<int:pk>/valider-membre/", seance_validate_member, name="ouverture-seance-valider-membre"),
    path("seances/<int:pk>/valider-president/", seance_validate_president, name="ouverture-seance-valider-president"),
]
