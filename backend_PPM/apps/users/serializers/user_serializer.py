from django.contrib.auth import get_user_model
from rest_framework import serializers
from apps.users.models import UserProfile

from apps.users.services.permissions import get_user_role

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
<<<<<<< HEAD

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Exception:
            return None
=======
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field="name",
    )

    def get_role(self, obj):
        return get_user_role(obj)
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
<<<<<<< HEAD
            "role",
=======
            "is_staff",
            "role",
            "groups",
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
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

<<<<<<< HEAD
        if role:
            UserProfile.objects.update_or_create(user=user, defaults={"role": role})

        return user
=======
        return user
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
