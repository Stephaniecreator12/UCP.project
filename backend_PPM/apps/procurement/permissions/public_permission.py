# apps/procurement/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

class BlockPublicUserFromWrite(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        access_type = request.META.get('HTTP_X_ACCESS_TYPE', '').lower()

        if access_type == 'public':
            return False

        return True
