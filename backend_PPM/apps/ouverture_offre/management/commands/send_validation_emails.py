from django.core.management.base import BaseCommand, CommandError

from apps.ouverture_offre.models import SeanceOuverture
from apps.ouverture_offre.services.notification_service import (
    notify_members_validation_requested,
    notify_president_validation_requested,
)


class Command(BaseCommand):
    help = "Send validation emails for a SeanceOuverture (members or president)."

    def add_arguments(self, parser):
        parser.add_argument("seance_pk", type=int, help="Primary key of the SeanceOuverture to notify")
        parser.add_argument(
            "--president",
            action="store_true",
            help="Send only the president invitation (instead of members)",
        )

    def handle(self, *args, **options):
        pk = options.get("seance_pk")
        send_president = options.get("president", False)

        try:
            seance = SeanceOuverture.objects.get(pk=pk)
        except SeanceOuverture.DoesNotExist:
            raise CommandError(f"SeanceOuverture with pk={pk} not found")

        self.stdout.write(f"Sending validation emails for seance pk={pk} (president={send_president})...")

        try:
            if send_president:
                sent = notify_president_validation_requested(seance)
            else:
                sent = notify_members_validation_requested(seance)
        except Exception as exc:
            raise CommandError(f"Failed to send validation emails: {exc}")

        self.stdout.write(self.style.SUCCESS(f"Done — {sent} email(s) sent."))
