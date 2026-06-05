from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta

from apps.log.models.consultation import LogConsultation
from apps.log.models.download import LogDownload
from apps.users.models.public import PublicProfile


@shared_task
def send_daily_ucp_report():

    yesterday = timezone.now() - timedelta(days=1)

    consultations = LogConsultation.objects.filter(
        timestamp__gte=yesterday
    ).count()

    downloads = LogDownload.objects.filter(
        timestamp__gte=yesterday
    ).count()

    registrations = PublicProfile.objects.filter(
        created_at__gte=yesterday
    ).count()

    message = f"""
Bonjour,

Rapport d'activité du {yesterday.date()} :

- Consultations : {consultations}
- Téléchargements : {downloads}
- Nouvelles inscriptions : {registrations}

Cordialement,
Plateforme e-Marchés
"""

    send_mail(
        subject="Rapport quotidien UCP",
        message=message,
        from_email=None,
        recipient_list=["ucp@marches.gov.mg"],
        fail_silently=False
    )

    return "Rapport envoyé"