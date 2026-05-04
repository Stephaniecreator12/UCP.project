from django.urls import path

from apps.users.views import public_view


urlpatterns = [

    path("me/", public_view.me),

    path("list/", public_view.list_users),

    path("create/", public_view.create_user),

]