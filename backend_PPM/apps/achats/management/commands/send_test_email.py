from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.achats.services.notification_service import send_notification_email


class Command(BaseCommand):
    help = "Envoie un email de test via la configuration Django actuelle."

    def add_arguments(self, parser):
        parser.add_argument("recipient", help="Adresse email de destination")

    def handle(self, *args, **options):
        recipient = options["recipient"].strip()
        if not recipient:
            raise CommandError("Une adresse email de destination est requise.")

        subject = "Test de notification UCP Achats"
        body = (
            "Bonjour,\n\n"
            "Cet email confirme que la configuration de notification UCP Achats "
            "fonctionne avec la configuration SMTP courante.\n\n"
            f"Frontend configure : {getattr(settings, 'FRONTEND_APP_URL', '-')}\n"
        )

        sent = send_notification_email(
            subject,
            body,
            [recipient],
            schedule_after_commit=False,
            fail_silently=False,
        )
        if not sent:
            raise CommandError("Aucun email n'a ete envoye.")

        self.stdout.write(
            self.style.SUCCESS(f"Email de test envoye vers {recipient}.")
        )
