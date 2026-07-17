from django.urls import path
from apps.users.views import user_view
from apps.users.views import auth_view
from apps.users.views.groups_view import list_groups
from apps.users.views.auth_view import inscription_view
urlpatterns = [
    path("me/", user_view.me),
    path("list/", user_view.list_users),
    path("create/", user_view.create_user),
    path('groups/', list_groups, name='list-groups'),
    path("by-email/", user_view.find_user_profile_by_email, name="find-user-by-email"),
    path("public/create/",auth_view.inscription_view,name='create-public-profile'),
    path("login/", user_view.login,name='users-login'),
    path("sync/",user_view.sync_rh_user,name="sync-rh-users")
]