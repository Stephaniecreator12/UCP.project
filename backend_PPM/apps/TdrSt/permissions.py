from __future__ import annotations

from rest_framework.permissions import BasePermission

from apps.TdrSt.models.TdrSt import TdrStDocument
from apps.users.services.permissions import TdrStRole, get_user_role

# Statuts finaux consultables par l'Auditeur (a posteriori uniquement)
AUDITEUR_VISIBLE_STATUTS = (
    TdrStDocument.Statut.VALIDE,
    TdrStDocument.Statut.REJETE,
    TdrStDocument.Statut.SUSPENDU,
)


class CanCreateDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == TdrStRole.INITIATEUR


class CanListMyDocuments(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == TdrStRole.INITIATEUR


class CanSubmitOrUploadOwnDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == TdrStRole.INITIATEUR

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        return obj.initiateur_id == getattr(request.user, "id", None)


class CanReadDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(get_user_role(request.user))

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        role = get_user_role(request.user)
        if role == TdrStRole.INITIATEUR:
            return obj.initiateur_id == getattr(request.user, "id", None)
        if role in (TdrStRole.VERIFICATEUR_TECHNIQUE, TdrStRole.APPROBATEUR_FINAL):
            return True
        if role == TdrStRole.BAILLEUR:
            if obj.statut == TdrStDocument.Statut.EN_ATTENTE_ANO:
                return True
            # Autoriser la consultation de l'historique des documents passes par l'etape ANO
            # (cas seuil depasse / etape bailleur), meme s'ils ne sont plus EN_ATTENTE_ANO.
            return obj.actions_validation.filter(etape="ANO").exists()
        if role == TdrStRole.AUDITEUR:
            # L'auditeur ne voit que les documents à statut final (Validé, Rejeté, Suspendu)
            return obj.statut in AUDITEUR_VISIBLE_STATUTS
        return False


class CanTechValidate(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == TdrStRole.VERIFICATEUR_TECHNIQUE


class CanFinalApprove(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == TdrStRole.APPROBATEUR_FINAL


class CanBailleurRead(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == TdrStRole.BAILLEUR


class CanAuditeurRead(BasePermission):
    """
    Permission réservée au rôle AUDITEUR.
    - Accès en lecture seule uniquement.
    - Visible : documents à statut final (VALIDE, REJETE, SUSPENDU) + toute la traçabilité (Section G).
    - Aucune action de décision (approuver / rejeter / soumettre) n'est accordée.
    """

    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == TdrStRole.AUDITEUR

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        return obj.statut in AUDITEUR_VISIBLE_STATUTS
