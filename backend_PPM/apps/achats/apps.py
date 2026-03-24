# déclarer l’app achats à Django.
from django.apps import AppConfig #AppConfig = classe de base fournie par Django.


class AchatsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.achats'
