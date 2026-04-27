from django.contrib.auth import get_user_model

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.users.serializers.user_serializer import (
    PublicProfileSerializer,
    PublicProfileRegistrationSerializer
)

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):

    serializer = PublicProfileSerializer(request.user)

    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def list_users(request):

    users = User.objects.all().select_related('employee_profile').order_by("id")

    serializer = PublicProfileSerializer(users, many=True)

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def create_user(request):

    serializer = PublicProfileRegistrationSerializer(data=request.data)

    if serializer.is_valid():

        user = serializer.save()

        return Response(
            PublicProfileSerializer(user).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)