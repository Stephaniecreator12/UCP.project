from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.core.mail import send_mail
from django.conf import settings
from apps.users.serializers.public_serializer import PublicProfileRegistrationSerializer
from apps.users.tasks.envoyer_confirmation_email_task import envoyer_confirmation_email
from apps.users.models import UserProfile

@api_view(["POST"])
@permission_classes([AllowAny])
def inscription_view(request):
    serializer = PublicProfileRegistrationSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()

    user.is_active = False
    user.save(update_fields=["is_active"])

    envoyer_confirmation_email.delay(
        user.email,
        user.full_name
    )

    return Response({
        "success": True,
        "message": "Utilisateur créé. Un e-mail de confirmation a été envoyé."
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny]) 
def verifier_email_view(request):
    token = request.data.get('token')
    
    if not token:
        return Response({"message": "Token requis."}, status=status.HTTP_400_BAD_REQUEST)
        
    signer = TimestampSigner()
    try:
        email = signer.unsign(token, max_age=86400)
        user = UserProfile.objects.get(email=email)
        
        if not user.is_active:
            user.is_active = True
            user.save()
            return Response({"message": "Compte activé avec succès !"}, status=status.HTTP_200_OK)
        return Response({"message": "Ce compte est déjà actif."}, status=status.HTTP_400_BAD_REQUEST)
            
    except SignatureExpired:
        return Response({"message": "Le lien de confirmation a expiré (maximum 24h)."}, status=status.HTTP_400_BAD_REQUEST)
    except (BadSignature, UserProfile.DoesNotExist):
        return Response({"message": "Lien invalide ou altéré."}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def renvoyer_email_view(request):
    email = request.data.get('email')
    
    if not email:
        return Response({"message": "L'adresse email est requise."}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = UserProfile.objects.get(email=email)
        
        if user.is_active:
            return Response({"message": "Ce compte est déjà actif. Vous pouvez vous connecter."}, status=status.HTTP_200_OK)
            
        envoyer_confirmation_email.delay(user.email, user.full_name)
        
        return Response({"message": "Un nouveau lien de confirmation a été envoyé."}, status=status.HTTP_200_OK)
        
    except UserProfile.DoesNotExist:
        return Response({"message": "Un nouveau lien de confirmation a été envoyé si le compte existe."}, status=status.HTTP_200_OK)