from rest_framework.permissions import BasePermission, SAFE_METHODS


SECRETAIRE_GROUP = "SECRETAIRE"


class IsSecretaireOuLectureSeule(BasePermission):
    """
    - GET/HEAD/OPTIONS : tout utilisateur authentifie peut lire
    - POST/PATCH : reserve aux secretaires
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name=SECRETAIRE_GROUP).exists()
        )
