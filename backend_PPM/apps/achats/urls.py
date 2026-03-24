from django.urls import path


from apps.achats.views.demande_view import (
    create_demande_view,
    demande_detail_view,
    my_demandes_view,
    submit_demande_view,
    transmit_demande_view,
)


from apps.achats.views.validation_view import (
    decision_validation_view,
    pending_validations_view,
)

urlpatterns = [
    path("demandes/", create_demande_view),
    path("demandes/me/", my_demandes_view),
    path("demandes/<int:id>/", demande_detail_view),
    path("demandes/<int:id>/submit/", submit_demande_view),
    path("demandes/<int:id>/transmit/", transmit_demande_view),
    path("validations/pending/", pending_validations_view),
    path("validations/decision/", decision_validation_view),
]
