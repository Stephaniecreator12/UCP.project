from django.contrib.auth import get_user_model
from rest_framework import serializers
from apps.users.models import PublicProfile
from apps.users.models import UserProfile
from django.core import exceptions as django_exceptions
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Exception:
            return None

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "role",
        ]


class UserCreateSerializer(UserSerializer):

    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=UserProfile.Role.choices, required=False)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["password"]

    def create(self, validated_data):

        password = validated_data.pop("password")
        role = validated_data.pop("role", None)

        user = User(**validated_data)

        user.set_password(password)

        user.save()

        if role:
            UserProfile.objects.update_or_create(user=user, defaults={"role": role})

        return user

class PublicProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = PublicProfile
        fields = [
            "id",
            'email', 
            'full_name', 
            'phone', 
            'type_entite', 
            'nif', 'password', 
            'updated_at'
        ]

class PublicProfileRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicProfile
        fields = ['email', 'full_name', 'phone', 'type_entite', 'nif', 'password', 'updated_at']
        extra_kwargs = {
            'email': {
                'error_messages': {
                    'blank': "L'adresse e-mail ne peut pas être vide.",
                    'unique': "L'adresse e-mail est déjà utilisé.",
                    'invalid': "Format d'email incorrect."
                }
            },
            'full_name': {
                'error_messages': {
                    'required': "Le nom complet est obligatoire.",
                    'blank': "Le nom complet ne peut pas être vide.",
                    'unique': "Le nom complet est déjà utilisé.",
                }
            },
            'type_entite': {
                'error_messages': {
                    'required': "Le type d'entité est obligatoire.", 
                    'blank': "Le type d'entité ne peut pas être vide.",
                    'invalid_choice': "Veuillez sélectionner un type d'entité valide parmi la liste.", # Ajouté
                }
            }
        }
    def validate(self, data):
        password = data.get('password')
        user_data = {k: v for k, v in data.items() if k not in ['is_employee', 'role']}
        publicProfile = UserProfile(**user_data) 
        try:
            validate_password(password, user=publicProfile)
        except django_exceptions.ValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return data
    