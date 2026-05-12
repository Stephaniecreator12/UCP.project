from __future__ import annotations

from rest_framework.permissions import BasePermission

from apps.TdrSt.models.TdrSt import TdrStDocument
from apps.users.models import UserProfile
from apps.users.services.permissions import get_user_role

class CanCreateDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.DEMANDEUR


class CanListMyDocuments(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.DEMANDEUR


class CanSubmitOrUploadOwnDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.DEMANDEUR

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        return obj.demandeur_id == getattr(request.user, "id", None)


class CanReadDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(get_user_role(request.user))

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        role = get_user_role(request.user)
        if role == UserProfile.Role.DEMANDEUR:
            return obj.demandeur_id == getattr(request.user, "id", None)
        if role in (UserProfile.Role.VERIFICATEUR_TECHNIQUE, UserProfile.Role.APPROBATEUR_FINAL):
            return True
        if role == UserProfile.Role.AUDITEUR:
            # L'auditeur a un accès global en lecture seule sur les documents TDR/ST.
            return True
        return False


class CanTechValidate(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.VERIFICATEUR_TECHNIQUE


class CanFinalApprove(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.APPROBATEUR_FINAL


class CanAuditeurRead(BasePermission):
    """
    Permission réservée au rôle AUDITEUR.
    - Accès en lecture seule uniquement.
    - Visible : tous les documents + toute la traçabilité (Section G).
    - Aucune action de décision (approuver / rejeter / soumettre) n'est accordée.
    """

    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.AUDITEUR

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        return True
