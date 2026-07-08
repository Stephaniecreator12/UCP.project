from django.contrib.auth import get_user_model

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from apps.users.serializers.user_serializer import (
    UserSerializer,
    UserCreateSerializer,
)
from apps.users.serializers.public_serializer import (
    PublicLoginSerializer,
    PublicProfileSerializer,
    PublicProfileRegistrationSerializer
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
    
    try:
        serializer = UserSerializer(user)
        data = serializer.data
    except Exception:
        data = {
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            'updated_at': user.updated_at,
            'created_at': user.created_at,
            "groups": list(user.groups.values_list("name", flat=True)),
        }

    return Response({
        "error": False,
        "data": data
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
@permission_classes([AllowAny])
def create_publicprofile(request):

    serializer = PublicProfileRegistrationSerializer(data=request.data)

    if serializer.is_valid():

        user = serializer.save()

        return Response(
            PublicProfileSerializer(user).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(["POST"])
@permission_classes([AllowAny])
def create_user(request):

    serializer = UserCreateSerializer(data=request.data)

    if serializer.is_valid():

        user = serializer.save()

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([AllowAny]) 
def public_login(request):
    serializer = PublicLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        user_data = PublicProfileSerializer(user).data
        
        return Response({
            "error": False,
            "message": "Connexion réussie",
            "user": user_data
        }, status=status.HTTP_200_OK)
    print("LOG ERREUR LOGIN :", serializer.errors)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])  
def get_user_profile_by_email(request):
    email = request.query_params.get('email')
    
    if not email:
        return Response({
            "error": True,
            "message": "Le paramètre 'email' est obligatoire."
        }, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user_profile = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            "error": True,
            "message": "Aucun profil trouvé pour cet email."
        }, status=status.HTTP_404_NOT_FOUND)
        
    serializer = UserSerializer(user_profile)
    return Response({
        "error": False,
        "data": serializer.data
    }, status=status.HTTP_200_OK)