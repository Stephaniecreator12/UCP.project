from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from apps.users.serializers.groups_serializer import GroupDetailSerializer
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from apps.users.services.permissions import get_user_role
from django.contrib.auth import authenticate
User = get_user_model()
class PublicProfileSerializer(serializers.ModelSerializer): 
    role = serializers.SerializerMethodField()

    def get_role(self, obj):
        return get_user_role(obj)
    groups_details = GroupDetailSerializer(
        source='groups', 
        many=True, 
        read_only=True
    )
    class Meta: 
        model = User
        fields = [ 
            "id", 
            'email', 
            'full_name', 
            'phone', 
            'type_entite', 
            'nif', 
            'groups_details',
            'updated_at',
            'created_at',
            'role'
            ] 
class PublicProfileRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    groups = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Group.objects.all(), 
        write_only=True,
        required=False
    )
    groups_details = GroupDetailSerializer(
        source='groups', 
        many=True, 
        read_only=True
    )
    class Meta:
        model = User
        fields = [
            'email',
            'full_name',
            'phone',
            'type_entite',
            'nif',
            'password',
            'groups',
            'groups_details',
            'updated_at',
            'created_at'
        ]

        extra_kwargs = {
            'email': {
                'error_messages': {
                    'blank': "L'adresse e-mail ne peut pas être vide.",
                    'unique': "L'adresse e-mail est déjà utilisée.",
                    'invalid': "Format d'email incorrect."
                }
            },
            'full_name': {
                'error_messages': {
                    'required': "Le nom complet est obligatoire.",
                    'blank': "Le nom complet ne peut pas être vide.",
                }
            },
            'type_entite': {
                'error_messages': {
                    'required': "Le type d'entité est obligatoire.",
                    'blank': "Le type d'entité ne peut pas être vide.",
                    'invalid_choice': "Veuillez sélectionner un type d'entité valide."
                }
            },
            'groups': {
                'error_messages': {
                    'required': "Le groupe est obligatoire.",
                    'blank': "Le groupe ne peut pas être vide.",
                    'invalid_choice': "Veuillez sélectionner un groupe valide."
                }
            }
        }

    def validate_password(self, value):
        validate_password(value)
        return value
    
    def validate(self, data):
        password = data.get('password')
        validate_password(password)
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        group, _ = Group.objects.get_or_create(name="public")
        user.groups.add(group)
        return user


class PublicLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs["email"]
        password = attrs["password"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                "email": ["Aucun compte n'est associé à cette adresse e-mail."]
            })

        if not user.check_password(password):
            raise serializers.ValidationError({
                "password": ["Mot de passe incorrect."]
            })

        if not user.is_active:
            raise serializers.ValidationError({
                "email": ["Ce compte est désactivé."]
            })

        authenticated_user = authenticate(
            email=email,
            password=password
        )

        if authenticated_user is None:
            raise serializers.ValidationError({
                "non_field_errors": ["Impossible de se connecter."]
            })

        attrs["user"] = authenticated_user
        return attrs