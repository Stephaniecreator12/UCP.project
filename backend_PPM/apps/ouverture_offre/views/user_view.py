from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import UNUSABLE_PASSWORD_PREFIX
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.ouverture_offre.serializers import SimpleUserSerializer

User = get_user_model()

# Groupes autorisés dans le dropdown président
ALLOWED_GROUPS = [
    "SECRETAIRE",
    "VALIDATEUR_HIERARCHIQUE",
    "VALIDATEUR_TECHNIQUE",
    "VALIDATEUR_PROGRAMMATIQUE",
    "APPROBATEUR_NATIONAL",
    "AGENT_ACHAT",
    "AGENT_MARCHE",
    "MARCHES",
    "LOGISTIQUE",
    "RAF",
    "FINANCE",
    "VALIDATEUR_BUDGETAIRE",
]

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def available_users(request):
    users = (
        User.objects.filter(is_active=True)
        .exclude(password__startswith=UNUSABLE_PASSWORD_PREFIX)
        .exclude(email__endswith="@ucp.local")  # exclut les comptes demo
        .filter(groups__name__in=ALLOWED_GROUPS)  # seulement vrais agents UCP
        .distinct()
        .order_by("first_name", "last_name", "username")
    )
    serializer = SimpleUserSerializer(users, many=True)
    return Response(serializer.data)