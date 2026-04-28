from __future__ import annotations

from django.contrib.auth import get_user_model


class TdrStRole:
    INITIATEUR = "initiateur"
    VERIFICATEUR_TECHNIQUE = "verificateur_technique"
    APPROBATEUR_FINAL = "approbateur_final"
    BAILLEUR = "bailleur"
    AUDITEUR = "auditeur"


ROLE_GROUPS: dict[str, tuple[str, ...]] = {
    TdrStRole.VERIFICATEUR_TECHNIQUE: ("VALIDATEUR_TECHNIQUE",),
    TdrStRole.APPROBATEUR_FINAL: ("APPROBATEUR_NATIONAL",),
    TdrStRole.BAILLEUR: ("BAILLEUR",),
    TdrStRole.AUDITEUR: ("AUDITEUR",),
}


def get_user_role(user) -> str | None:
    if not user or not getattr(user, "is_authenticated", False):
        return None

    group_names = set(user.groups.values_list("name", flat=True))
    for role, groups in ROLE_GROUPS.items():
        if group_names.intersection(groups):
            return role

    return TdrStRole.INITIATEUR


def get_users_for_role(role: str):
    User = get_user_model()
    groups = ROLE_GROUPS.get(role, ())
    if not groups:
        return User.objects.none()
    return User.objects.filter(is_active=True, groups__name__in=groups).distinct()
