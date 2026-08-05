from rest_framework.permissions import BasePermission
from apps.authorization.constants import ADMIN, SECRETAIRE, SECRETAIRE_CONTRACTUALISATION


class IsSecretaireContractualisation(BasePermission):
    """
    Autorise l'accès au module contractualisation aux secrétaires.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(
                name__in=[ADMIN, SECRETAIRE, SECRETAIRE_CONTRACTUALISATION]
            ).exists()
        )
