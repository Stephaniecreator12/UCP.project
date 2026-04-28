from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.achats.models import DemandeAchat
from apps.achats.services.notification_service import notify_validation_delay

class Command(BaseCommand):
    help = 'Vérifie les demandes en retard de validation (> 24h) et envoie des rappels par email'

    def handle(self, *args, **options):
        now = timezone.now()
        threshold = now - timedelta(hours=24)

        # On cherche les demandes SOUMISE ou A_COMPLETER (en attente d'action)
        # qui n'ont pas bougé depuis plus de 24h
        delayed_demandes = DemandeAchat.objects.filter(
            statut__in=[DemandeAchat.STATUT_SOUMISE, DemandeAchat.STATUT_A_COMPLETER],
            updated_at__lt=threshold
        )

        self.stdout.write(f"Vérification des retards à {now}...")
        
        count = 0
        for demande in delayed_demandes:
            # Calcul du retard en heures
            diff = now - demande.updated_at
            hours_delayed = int(diff.total_seconds() // 3600)
            
            self.stdout.write(f"Demande {demande.numero_demande} en retard de {hours_delayed}h. Notification envoyée.")
            notify_validation_delay(demande, hours_delayed)
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Terminé. {count} notifications de rappel envoyées."))
