from celery import shared_task
from django.core.mail import send_mail

from apps.log.services.operational_monitoring_service import (
    get_operational_monitoring_data
)


@shared_task
def send_operational_report():

    data = get_operational_monitoring_data()

    message = []

    # 📊 KPI
    message.append("📊 RAPPORT OPÉRATIONNEL\n")
    message.append(f"Taux de clôture : {data['closure_rate']} %\n")

    # 👻 invisibles
    message.append("\n👻 Dossiers sans consultation (7 jours)")
    if data["invisible_folders"]:
        for d in data["invisible_folders"]:
            message.append(f"- {d['title']}")
    else:
        message.append("- Aucun")

    # ⏰ alertes 48h
    message.append("\n⏰ Alertes < 48h")
    if data["alerts"]:
        for a in data["alerts"]:
            message.append(f"- {a['title']} (deadline: {a['deadline']})")
    else:
        message.append("- Aucune")

    send_mail(
        subject="📊 Rapport opérationnel quotidien",
        message="\n".join(message),
        from_email=None,
        recipient_list=["ucp@marches.gov.mg"],
        fail_silently=False
    )