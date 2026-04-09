from __future__ import annotations

from typing import Optional

from rest_framework.permissions import BasePermission

from apps.users.models import UserProfile


def get_user_role(user) -> Optional[str]:
    """
    Returns the role code for an authenticated user.
    If the profile is missing (older DB), it is created with the default role.
    """
    if not user or not getattr(user, "is_authenticated", False):
        return None

    try:
        return user.profile.role
    except Exception:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile.role


class RolePermission(BasePermission):
    allowed_roles: tuple[str, ...] = ()

    def has_permission(self, request, view) -> bool:
        role = get_user_role(getattr(request, "user", None))
        return bool(role) and role in self.allowed_roles


class IsInitiateur(RolePermission):
    allowed_roles = (UserProfile.Role.INITIATEUR,)


class IsVerificateurTechnique(RolePermission):
    allowed_roles = (UserProfile.Role.VERIFICATEUR_TECHNIQUE,)


class IsApprobateurFinal(RolePermission):
    allowed_roles = (UserProfile.Role.APPROBATEUR_FINAL,)


class IsBailleur(RolePermission):
    allowed_roles = (UserProfile.Role.BAILLEUR,)

class IsAuditeur(RolePermission):
    allowed_roles = (UserProfile.Role.AUDITEUR,)

