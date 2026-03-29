from __future__ import annotations

from rest_framework.permissions import BasePermission

from apps.TdrSt.models.TdrSt import TdrStDocument
from apps.users.models import UserProfile
from apps.users.services.permissions import get_user_role


class CanCreateDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.INITIATEUR


class CanListMyDocuments(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.INITIATEUR


class CanSubmitOrUploadOwnDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.INITIATEUR

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        return obj.initiateur_id == getattr(request.user, "id", None)


class CanReadDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(get_user_role(request.user))

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        role = get_user_role(request.user)
        if role == UserProfile.Role.INITIATEUR:
            return obj.initiateur_id == getattr(request.user, "id", None)
        if role in (UserProfile.Role.VERIFICATEUR_TECHNIQUE, UserProfile.Role.APPROBATEUR_FINAL):
            return True
        if role == UserProfile.Role.BAILLEUR:
            return obj.statut == TdrStDocument.Statut.EN_ATTENTE_ANO
        return False


class CanTechValidate(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.VERIFICATEUR_TECHNIQUE


class CanFinalApprove(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.APPROBATEUR_FINAL


class CanBailleurRead(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.BAILLEUR
