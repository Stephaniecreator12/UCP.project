from rest_framework.permissions import BasePermission

from apps.users.authentifications.authentification import ExternalUser


class IsExternalRHUser(BasePermission):

    message = "Accès réservé aux utilisateurs authentifiés via la base RH."

    def has_permission(self, request, view):
        return isinstance(request.user, ExternalUser)