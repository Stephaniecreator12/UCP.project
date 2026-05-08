from django.contrib.auth.password_validation import validate_password
from apps.users.models import PublicProfile
from rest_framework import serializers
from django.core import exceptions as django_exceptions

class PublicProfileSerializer(serializers.ModelSerializer): 
    class Meta: 
        model = PublicProfile 
        fields = [ 
            "id", 
            'email', 
            'full_name', 
            'phone', 
            'type_entite', 
            'nif', 
            'updated_at' 
            ] 
class PublicProfileRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = PublicProfile
        fields = [
            'email',
            'full_name',
            'phone',
            'type_entite',
            'nif',
            'password',
            'updated_at'
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
        return PublicProfile.objects.create_user(**validated_data)


class PublicLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = PublicProfile.objects.get(email=email)
        except PublicProfile.DoesNotExist:
            raise serializers.ValidationError({
                "error": "not_found",
                "message": "Utilisateur introuvable"
            })

        if not user.check_password(password):
            raise serializers.ValidationError({
                "error": "invalid_credentials",
                "message": "Mot de passe incorrect"
            })

        data['user'] = user
        return data