from django.urls import path

from apps.common.views import reference_choices_view

urlpatterns = [
    path("choices/", reference_choices_view, name="reference-choices"),
]
