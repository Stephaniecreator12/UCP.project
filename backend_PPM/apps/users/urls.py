from django.urls import path

from apps.users.views import public_view


urlpatterns = [

<<<<<<< HEAD
    path("me/", public_view.me),
=======
    path("me/", user_view.me),
    path("external-personnel/", user_view.external_personnel),
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d

    path("list/", public_view.list_users),

    path("create/", public_view.create_user),

]
