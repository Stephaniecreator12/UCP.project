import copy
from rest_framework.permissions import DjangoModelPermissions

class StrictModelPermissions(DjangoModelPermissions):
    perms_map = copy.deepcopy(DjangoModelPermissions.perms_map)
    perms_map['GET'] = ['%(app_label)s.view_%(model_name)s']