from django.contrib.auth import get_user_model

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from apps.users.serializers.user_serializer import (
    UserSerializer,
    UserCreateSerializer,
)

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    # Central profile endpoint consumed by the frontend after login.
    # It is the place where UI routing can read shared identity data
    # such as email, username and groups.
    serializer = UserSerializer(request.user)

    return Response(serializer.data)


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
