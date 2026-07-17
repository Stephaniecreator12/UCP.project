from django.contrib.auth import get_user_model
from rest_framework import serializers
from apps.users.models import UserProfile
from django.core import exceptions as django_exceptions
from apps.users.serializers.groups_serializer import GroupDetailSerializer
from django.contrib.auth.models import Group
from apps.users.services.permissions import get_user_role
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field="name",
    )
    def get_role(self, obj):
        return get_user_role(obj)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "is_active",
            "is_staff",
            "updated_at",
            "created_at",
            "groups",
            "role",
        ]




class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    groups = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Group.objects.all(), 
        write_only=True,
        required=False
    )
    class Meta:
        model = UserProfile
        fields = [
            'email',
            'password',
            'groups'
        ]
        extra_kwargs = {
            'email': {
                'error_messages': {
                    'blank': "L'adresse e-mail ne peut pas être vide.",
                    'unique': "L'adresse e-mail est déjà utilisée.",
                    'invalid': "Format d'email incorrect."
                }
            },
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
        group, _ = Group.objects.get_or_create(name="DEMANDEUR")
        user.groups.add(group)
        return user
