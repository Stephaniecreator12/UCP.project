from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.users.serializers.public_serializer import (
    PublicLoginSerializer,
    PublicProfileSerializer,
    PublicProfileRegistrationSerializer
)

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):

    serializer = PublicProfileSerializer(request.user)

    return Response({
        "error": False,
        "data": serializer.data
    })


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
    
class PublicLoginView(APIView):

    def post(self, request):

        serializer = PublicLoginSerializer(data=request.data)

       

        if serializer.is_valid():

            user = serializer.validated_data['user']
            update_last_login(None, user)

            refresh = RefreshToken.for_user(user)

            return Response({

                'refresh': str(refresh),

                'access': str(refresh.access_token),

                'message': 'Connexion réussie'

            }, status=status.HTTP_200_OK)



        errors = serializer.errors

 

        if "not_found" in str(errors):

            return Response(errors, status=status.HTTP_404_NOT_FOUND)

           

        return Response(errors, status=status.HTTP_400_BAD_REQUEST)