from django.contrib.auth import get_user_model
from rest_framework import serializers
from apps.users.models import UserProfile

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