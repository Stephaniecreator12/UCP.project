from django.urls import path
from apps.users.views import user_view
from apps.users.views.groups_view import list_groups
urlpatterns = [
    path("me/", user_view.me),
    path("external-personnel/", user_view.external_personnel),
    path("list/", user_view.list_users),
    path("create/", user_view.create_user),
    path('groups/', list_groups, name='list-groups'),
]