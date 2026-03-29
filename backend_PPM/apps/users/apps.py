# déclarer l’app users à Django.
from django.apps import AppConfig


class UsersConfig(AppConfig): #UsersConfig = nom de la configuration
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        # Register signals (profile auto-creation).
        from .services import usersService  # noqa: F401
