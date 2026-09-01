from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.authentifications.authentification import resolve_mock_rh_login
from apps.users.tasks.envoyer_confirmation_email_task import envoyer_confirmation_email
User = get_user_model()


def _personnel_payload(user):
    return {
        "id": user.id,
        "username": getattr(user, "username", "") or user.email,
        "email": user.email,
        "first_name": getattr(user, "first_name", "") or "",
        "last_name": getattr(user, "last_name", "") or "",
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "groups": list(user.groups.values_list("name", flat=True)),
    }


def _mock_rh_payload(user_data):
    return {
        "id": int(user_data["id"]),
        "username": user_data["email"],
        "email": user_data["email"],
        "first_name": user_data["prenom"],
        "last_name": user_data["nom"],
        "is_active": user_data["is_active"],
        "is_staff": False,
        "groups": list(user_data.get("groups", [])),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def personnel_login_view(request):
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''

    if not email or not password:
        return Response({
            "success": False,
            "message": "L'adresse e-mail et le mot de passe sont requis."
        }, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first()
    if not user or not user.check_password(password):
        mock_login = resolve_mock_rh_login(email)
        if mock_login:
            token, user_data = mock_login
            return Response({
                "success": True,
                "token": token,
                "user": _mock_rh_payload(user_data),
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "message": "l'adresse e-mail ou mot de passe incorrect"
        }, status=status.HTTP_400_BAD_REQUEST)

    if not user.is_active:
        return Response({
            "success": False,
            "message": "Ce compte est inactif."
        }, status=status.HTTP_400_BAD_REQUEST)

    refresh = RefreshToken.for_user(user)
    return Response({
        "success": True,
        "token": str(refresh.access_token),
        "refresh": str(refresh),
        "user": _personnel_payload(user),
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny]) 
def inscription_view(request):
    full_name = request.data.get('full_name')
    email = request.data.get('email')
    password = request.data.get('password')
    phone = request.data.get('phone')
    type_entite = request.data.get('type_entite')
    nif = request.data.get('nif')
    
    if not email or not password or not full_name:
        return Response({
            "success": False,
            "message": "Le nom complet, l'email et le mot de passe sont requis."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Bloquer l'inscription pour les emails internes de l'UCP
    email_lower = email.strip().lower()
    if email_lower.endswith('@ucp') or email_lower.endswith('@ucp.mg'):
        return Response({
            "success": False,
            "message": "Les comptes du personnel UCP sont gérés par la Direction des Ressources Humaines. Vous ne pouvez pas créer de compte manuellement."
        }, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({
            "success": False,
            "message": "Cet e-mail est déjà utilisé."
        }, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.create_user(
            email=email, 
            password=password,
            full_name=full_name,
            phone=phone,
            type_entite=type_entite,
            nif=nif
        )
        user.is_active = False 
        user.save()

        envoyer_confirmation_email.delay(
            user.email,
            user.full_name
        )
        
        return Response({
            "success": True,
            "message": "Utilisateur créé. Un e-mail de confirmation a été envoyé."
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Erreur lors de l'inscription ou envoi email: {e}")
        return Response({
            "success": False,
            "message": f"Une erreur est survenue: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny]) 
def verifier_email_view(request):
    token = request.data.get('token')
    
    if not token:
        return Response({"message": "Token requis."}, status=status.HTTP_400_BAD_REQUEST)
        
    signer = TimestampSigner()
    try:
        email = signer.unsign(token, max_age=86400)
        user = User.objects.get(email=email)
        
        if not user.is_active:
            user.is_active = True
            user.save()
            return Response({"message": "Compte activé avec succès !"}, status=status.HTTP_200_OK)
        return Response({"message": "Ce compte est déjà actif."}, status=status.HTTP_400_BAD_REQUEST)
            
    except SignatureExpired:
        return Response({"message": "Le lien de confirmation a expiré (maximum 24h)."}, status=status.HTTP_400_BAD_REQUEST)
    except (BadSignature, User.DoesNotExist):
        return Response({"message": "Lien invalide ou altéré."}, status=status.HTTP_400_BAD_REQUEST)
