from django.urls import path
from apps.ppm.views import travaux_view
from apps.ppm.views import biens_view
from apps.ppm.views import consultances_view


urlpatterns = [
    path("travaux/add/", travaux_view.add_travaux),
    path("travaux/update/<int:id>/", travaux_view.edit_travaux),
    path("travaux/list/", travaux_view.list_travaux_view),
    path("travaux/delete/<int:id>/", travaux_view.delete_travaux_view),
    path("travaux/planning/", travaux_view.planning_travaux),
    path("travaux/status/", travaux_view.status_travaux_view),
    path("travaux/arreter/<int:id>/", travaux_view.stop_travaux_view),
    
    path("biens/add/", biens_view.add_biens),
    path("biens/update/<int:id>/", biens_view.edit_biens),
    path("biens/list/", biens_view.list_biens_view),
    path("biens/planning/", biens_view.planning_biens),
    path("biens/status/", biens_view.status_biens_view),
    path("biens/delete/<int:id>/", biens_view.delete_biens_view),
    path("biens/arreter/<int:id>/", biens_view.stop_biens_view),
    
    path("consultances/add/", consultances_view.add_consultance),
    path("consultances/update/<int:id>/", consultances_view.edit_consultance),
    path("consultances/list/", consultances_view.list_consultance_view),
    path("consultances/planning/", consultances_view.planning_consultance),
    path("consultances/status/", consultances_view.status_consultance_view),
    path("consultances/delete/<int:id>/", consultances_view.delete_consultance_view),
    path("consultances/arreter/<int:id>/", consultances_view.stop_consultance_view),
]
