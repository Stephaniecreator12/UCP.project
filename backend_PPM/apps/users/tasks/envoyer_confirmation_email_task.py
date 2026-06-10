from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import TimestampSigner

@shared_task
def envoyer_confirmation_email(email, full_name):
    signer = TimestampSigner()
    token = signer.sign(email)

    lien_activation = (
        f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"
    )

    sujet = "Activez votre compte UCP"

    message = (
        f"Bonjour {full_name},\n\n"
        f"Cliquez sur ce lien pour activer votre compte "
        f"(valable 24h) : {lien_activation}"
    )

    send_mail(
        sujet,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )