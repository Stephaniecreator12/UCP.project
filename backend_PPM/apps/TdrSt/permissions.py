from __future__ import annotations

from rest_framework.permissions import BasePermission

from apps.TdrSt.models.TdrSt import TdrStDocument
from apps.authorization.constants import VALIDATEUR_TECHNIQUE, APPROBATEUR_NATIONAL, AUDITEUR

class CanCreateDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)


class CanListMyDocuments(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)


class CanSubmitOrUploadOwnDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        return obj.demandeur_id == getattr(request.user, "id", None)


class CanReadDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False

        user_groups = set(user.groups.values_list("name", flat=True))
        if user_groups.intersection({VALIDATEUR_TECHNIQUE, APPROBATEUR_NATIONAL, AUDITEUR}):
            return True

        return obj.demandeur_id == user.id


class CanTechValidate(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name=VALIDATEUR_TECHNIQUE).exists()
        )


class CanFinalApprove(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name=APPROBATEUR_NATIONAL).exists()
        )


class CanAuditeurRead(BasePermission):
    """
    Permission réservée au rôle AUDITEUR.
    - Accès en lecture seule uniquement.
    - Visible : tous les documents + toute la traçabilité (Section G).
    - Aucune action de décision (approuver / rejeter / soumettre) n'est accordée.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name=AUDITEUR).exists()
        )

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        return True
