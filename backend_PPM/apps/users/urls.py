from django.urls import path
from apps.users.views import user_view
from apps.users.views.public_view import PublicLoginView  # ← ajouter cet import

urlpatterns = [
    path("me/", user_view.me),
    path("external-personnel/", user_view.external_personnel),
    path("list/", user_view.list_users),
    path("create/", user_view.create_user),
    path("public/login/", PublicLoginView.as_view(), name="public_login"),  # ← ajouter
]