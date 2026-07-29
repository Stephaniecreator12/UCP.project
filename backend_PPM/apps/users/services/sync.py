from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model

User = get_user_model()


def sync_user_from_rh(email, password):
    user, created = User.objects.get_or_create(
        email=email
    )

    user.set_password(password)

    if created:
        user.is_active = True
        group, _ = Group.objects.get_or_create(name="DEMANDEUR")
        user.groups.add(group)
    else:
        # S'assurer que l'utilisateur existant a au moins un groupe
        if not user.groups.exists():
            group, _ = Group.objects.get_or_create(name="DEMANDEUR")
            user.groups.add(group)

    user.save()

    return user