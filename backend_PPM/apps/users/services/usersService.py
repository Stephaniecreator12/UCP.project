from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.users.models import PublicProfile
User = get_user_model()

@receiver(post_save, sender=User)
def ensure_public_profile(sender, instance, created, **kwargs):
    if created:
        return;