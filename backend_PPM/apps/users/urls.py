from django.urls import path

from apps.users.views import public_view
from apps.users.views import user_view

urlpatterns = [

    path("me/", public_view.me),
    path("external-personnel/", user_view.external_personnel),

    path("list/", public_view.list_users),

    path("create/", public_view.create_user),

]
