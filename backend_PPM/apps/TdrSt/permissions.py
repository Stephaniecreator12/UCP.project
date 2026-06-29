from __future__ import annotations

from rest_framework.permissions import BasePermission

from apps.TdrSt.models.TdrSt import TdrStDocument
from apps.users.models import UserProfile
from apps.users.services.permissions import get_user_role

# Statuts finaux consultables par l'Auditeur (a posteriori uniquement)
AUDITEUR_VISIBLE_STATUTS = (
    TdrStDocument.Statut.VALIDE,
    TdrStDocument.Statut.REJETE,
    TdrStDocument.Statut.SUSPENDU,
)


class CanCreateDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
<<<<<<< HEAD
        return get_user_role(request.user) == UserProfile.Role.INITIATEUR
=======
        return get_user_role(request.user) == UserProfile.Role.DEMANDEUR
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d


class CanListMyDocuments(BasePermission):
    def has_permission(self, request, view) -> bool:
<<<<<<< HEAD
        return get_user_role(request.user) == UserProfile.Role.INITIATEUR
=======
        return get_user_role(request.user) == UserProfile.Role.DEMANDEUR
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d


class CanSubmitOrUploadOwnDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
<<<<<<< HEAD
        return get_user_role(request.user) == UserProfile.Role.INITIATEUR

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        return obj.initiateur_id == getattr(request.user, "id", None)
=======
        return get_user_role(request.user) == UserProfile.Role.DEMANDEUR

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        return obj.demandeur_id == getattr(request.user, "id", None)
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d


class CanReadDocument(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(get_user_role(request.user))

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
        role = get_user_role(request.user)
<<<<<<< HEAD
        if role == UserProfile.Role.INITIATEUR:
            return obj.initiateur_id == getattr(request.user, "id", None)
        if role in (UserProfile.Role.VERIFICATEUR_TECHNIQUE, UserProfile.Role.APPROBATEUR_FINAL):
            return True
        if role == UserProfile.Role.BAILLEUR:
            if obj.statut == TdrStDocument.Statut.EN_ATTENTE_ANO:
                return True
            # Autoriser la consultation de l'historique des documents passes par l'etape ANO
            # (cas seuil depasse / etape bailleur), meme s'ils ne sont plus EN_ATTENTE_ANO.
            return obj.actions_validation.filter(etape="ANO").exists()
=======
        if role == UserProfile.Role.DEMANDEUR:
            return obj.demandeur_id == getattr(request.user, "id", None)
        if role in (UserProfile.Role.VERIFICATEUR_TECHNIQUE, UserProfile.Role.APPROBATEUR_FINAL):
            return True
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
        if role == UserProfile.Role.AUDITEUR:
            # L'auditeur ne voit que les documents à statut final (Validé, Rejeté, Suspendu)
            return obj.statut in AUDITEUR_VISIBLE_STATUTS
        return False


class CanTechValidate(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.VERIFICATEUR_TECHNIQUE


class CanFinalApprove(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.APPROBATEUR_FINAL


<<<<<<< HEAD
class CanBailleurRead(BasePermission):
    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.BAILLEUR


=======
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
class CanAuditeurRead(BasePermission):
    """
    Permission réservée au rôle AUDITEUR.
    - Accès en lecture seule uniquement.
    - Visible : documents à statut final (VALIDE, REJETE, SUSPENDU) + toute la traçabilité (Section G).
    - Aucune action de décision (approuver / rejeter / soumettre) n'est accordée.
    """

    def has_permission(self, request, view) -> bool:
        return get_user_role(request.user) == UserProfile.Role.AUDITEUR

    def has_object_permission(self, request, view, obj: TdrStDocument) -> bool:
<<<<<<< HEAD
        return obj.statut in AUDITEUR_VISIBLE_STATUTS
=======
        return obj.statut in AUDITEUR_VISIBLE_STATUTS
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
