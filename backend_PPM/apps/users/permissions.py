import copy
from rest_framework.permissions import BasePermission, DjangoModelPermissions
from apps.authorization.constants import ADMIN

class StrictModelPermissions(DjangoModelPermissions):
    perms_map = copy.deepcopy(DjangoModelPermissions.perms_map)
    perms_map['GET'] = ['%(app_label)s.view_%(model_name)s']


class IsAdminGroup(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name=ADMIN).exists()
        )