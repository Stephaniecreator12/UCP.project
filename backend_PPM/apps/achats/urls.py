from django.urls import path

from apps.achats.views import demande_view
from apps.achats.views import validation_view


urlpatterns = [

    path("demandes/add/", demande_view.add_demande),

    path("demandes/list/", demande_view.list_demandes_view),

    path("validations/add/", validation_view.add_validation),

]