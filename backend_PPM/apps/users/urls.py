from django.urls import path

from apps.users.views import user_view


urlpatterns = [

    path("me/", user_view.me),
    path("external-personnel/", user_view.external_personnel),

    path("list/", user_view.list_users),

    path("create/", user_view.create_user),

]
