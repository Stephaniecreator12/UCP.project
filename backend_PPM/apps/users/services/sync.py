from django.contrib.auth import get_user_model

User = get_user_model()


def sync_user_from_rh(email, password):
    user, created = User.objects.get_or_create(
        email=email
    )

    user.set_password(password)

    if created:
        user.is_active = True
        user.save()

    else:
        user.save(update_fields=["password"])

    return user