import math
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.achats.models import DemandeAchat, HistoriqueDemande
from apps.achats.services.history_service import create_history_entry
from apps.achats.services.notification_service import notify_validation_delay


def _add_business_days(value, days):
    deadline = value
    days_added = 0

    while days_added < days:
        deadline += timedelta(days=1)
        if deadline.weekday() < 5:
            days_added += 1

    return deadline


def _get_validation_deadline(demande):
    reference = demande.updated_at or demande.submitted_at or demande.created_at
    duration_days = 2 if demande.priorite == DemandeAchat.PRIORITE_URGENT else 5
    return _add_business_days(reference, duration_days)


def _already_reminded_since_last_update(demande):
    return demande.historiques.filter(
        action=HistoriqueDemande.ACTION_RAPPEL_VALIDATION_24H,
        created_at__gte=demande.updated_at,
    ).exists()


class Command(BaseCommand):
    help = "Vérifie les dossiers à moins de 24h de leur échéance et envoie un rappel unique par email."

    def handle(self, *args, **options):
        now = timezone.now()
        pending_demandes = DemandeAchat.objects.filter(
            statut__in=[DemandeAchat.STATUT_SOUMISE, DemandeAchat.STATUT_A_COMPLETER]
        ).prefetch_related("historiques")

        self.stdout.write(f"Vérification des rappels d'échéance à {now}...")

        count = 0
        for demande in pending_demandes:
            if _already_reminded_since_last_update(demande):
                continue

            deadline = _get_validation_deadline(demande)
            remaining_seconds = (deadline - now).total_seconds()
            if remaining_seconds <= 0 or remaining_seconds > 24 * 3600:
                continue

            hours_remaining = max(1, math.ceil(remaining_seconds / 3600))
            sent = notify_validation_delay(demande, hours_remaining)
            if not sent:
                continue

            create_history_entry(
                demande=demande,
                action=HistoriqueDemande.ACTION_RAPPEL_VALIDATION_24H,
                description="Un rappel automatique à 24h de l'échéance a été envoyé.",
                metadata={
                    "hours_remaining": hours_remaining,
                    "deadline_at": deadline.isoformat(),
                    "statut": demande.statut,
                    "etape_validation_actuelle": demande.etape_validation_actuelle,
                },
            )
            self.stdout.write(
                f"Demande {demande.numero_demande} : rappel 24h envoyé ({hours_remaining}h restantes)."
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Terminé. {count} notifications de rappel envoyées."))
