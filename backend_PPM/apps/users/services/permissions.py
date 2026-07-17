from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Q


class TdrStRole:
    DEMANDEUR = "demandeur"
    INITIATEUR = "demandeur"
    VERIFICATEUR_TECHNIQUE = "verificateur_technique"
    APPROBATEUR_FINAL = "approbateur_final"
    AUDITEUR = "auditeur"
    PUBLIC = "public"


ROLE_GROUPS: dict[str, tuple[str, ...]] = {
    "verificateur_technique": ("VALIDATEUR_TECHNIQUE",),
    "approbateur_final": ("APPROBATEUR_NATIONAL",),
    "auditeur": ("AUDITEUR",),
    "public": ("PUBLIC",),
    "demandeur": ("DEMANDEUR",),
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
    if not user or not getattr(user, "is_authenticated", False):
        return None

    mapped_role = _group_mapped_role(user)
    if mapped_role:
        return mapped_role

    return "demandeur"


def get_users_for_role(role: str):
    User = get_user_model()
    queryset = User.objects.filter(is_active=True)

    groups = ROLE_GROUPS.get(role, ())
    if groups:
        return queryset.filter(groups__name__in=groups).distinct()

    if role == "demandeur":
        return queryset.exclude(groups__name__in=ALL_TDR_GROUPS).distinct()

    return queryset.none()
