from django.contrib.auth import get_user_model

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from apps.users.serializers.user_serializer import (
    UserSerializer,
    UserCreateSerializer,
)
from apps.users.serializers.public_serializer import (
    PublicLoginSerializer,
    PublicProfileSerializer,
    PublicProfileRegistrationSerializer,
)
from apps.users.services.external_personnel import (
    ExternalPersonnelApiError,
    fetch_external_personnel_directory,
)

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    
    if hasattr(user, "full_name"):
        serializer = PublicProfileSerializer(user)
        data = serializer.data
    else:
        data = {
            "id": user.id,
            "username": getattr(user, "username", "") or user.email,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "groups": list(user.groups.values_list("name", flat=True)),
        }

    return Response({
        "error": False,
        "data": data,
        **data,
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def external_personnel(request):
    try:
        personnel = fetch_external_personnel_directory()
    except ExternalPersonnelApiError as exc:
        payload = {"error": exc.message}
        if exc.detail:
            payload["detail"] = exc.detail
        return Response(payload, status=exc.status_code)

    return Response(personnel)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def list_users(request):

    users = User.objects.all().order_by("id")

    serializer = UserSerializer(users, many=True)

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_user(request):

    serializer = UserCreateSerializer(data=request.data)

    if serializer.is_valid():

        user = serializer.save()

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
