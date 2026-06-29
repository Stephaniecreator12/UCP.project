from rest_framework.permissions import BasePermission, SAFE_METHODS

EVALUATEUR_GROUP  = "EVALUATEUR"
SECRETAIRE_GROUP  = "SECRETAIRE"
PRESIDENT_GROUP   = "PRESIDENT"


class IsEvaluateur(BasePermission):
    """
    Seuls les membres du groupe EVALUATEUR
    peuvent remplir les formulaires d'évaluation.
    """
    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name=EVALUATEUR_GROUP).exists()
        )


class IsSecretaireOuEvaluateur(BasePermission):
    """
    - GET : tout utilisateur authentifié peut lire
    - POST : secrétaire ou évaluateur seulement
    """
    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.groups.filter(
            name__in=[SECRETAIRE_GROUP, EVALUATEUR_GROUP]
        ).exists()


class IsSecretaire(BasePermission):
    """
    Réservé au secrétaire — pour assigner les évaluateurs.
    """
    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name=SECRETAIRE_GROUP).exists()
        )


class IsPresident(BasePermission):
    """
    Réservé au président — pour la consolidation finale.
    """
    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name=PRESIDENT_GROUP).exists()
        )