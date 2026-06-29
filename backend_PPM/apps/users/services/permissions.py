from __future__ import annotations

<<<<<<< HEAD
from typing import Optional

from rest_framework.permissions import BasePermission
=======
from django.contrib.auth import get_user_model
from django.db.models import Q
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d

from apps.users.models import UserProfile


<<<<<<< HEAD
def get_user_role(user) -> Optional[str]:
    """
    Returns the role code for an authenticated user.
    If the profile is missing (older DB), it is created with the default role.
    """
=======
class TdrStRole:
    DEMANDEUR = UserProfile.Role.DEMANDEUR
    INITIATEUR = UserProfile.Role.DEMANDEUR
    VERIFICATEUR_TECHNIQUE = UserProfile.Role.VERIFICATEUR_TECHNIQUE
    APPROBATEUR_FINAL = UserProfile.Role.APPROBATEUR_FINAL
    AUDITEUR = UserProfile.Role.AUDITEUR


ROLE_GROUPS: dict[str, tuple[str, ...]] = {
    UserProfile.Role.VERIFICATEUR_TECHNIQUE: ("VALIDATEUR_TECHNIQUE",),
    UserProfile.Role.APPROBATEUR_FINAL: ("APPROBATEUR_NATIONAL",),
    UserProfile.Role.AUDITEUR: ("AUDITEUR",),
}

ALL_TDR_GROUPS = tuple(
    group_name
    for groups in ROLE_GROUPS.values()
    for group_name in groups
)


def _group_mapped_role(user) -> str | None:
    group_names = set(user.groups.values_list("name", flat=True))
    for role, groups in ROLE_GROUPS.items():
        if group_names.intersection(groups):
            return role
    return None


def get_user_role(user) -> str | None:
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    if not user or not getattr(user, "is_authenticated", False):
        return None

    try:
<<<<<<< HEAD
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

=======
        profile_role = user.profile.role
    except Exception:
        profile_role = None

    if profile_role and profile_role != UserProfile.Role.DEMANDEUR:
        return profile_role

    mapped_role = _group_mapped_role(user)
    if mapped_role:
        return mapped_role

    return profile_role or UserProfile.Role.DEMANDEUR


def get_users_for_role(role: str):
    User = get_user_model()
    queryset = User.objects.filter(is_active=True)

    profile_filter = Q(profile__role=role)
    groups = ROLE_GROUPS.get(role, ())

    if groups:
        return queryset.filter(profile_filter | Q(groups__name__in=groups)).distinct()

    if role == UserProfile.Role.DEMANDEUR:
        return queryset.filter(profile_filter).distinct()

    return queryset.none()
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
