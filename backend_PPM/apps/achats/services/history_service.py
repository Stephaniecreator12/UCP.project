from apps.achats.models import HistoriqueDemande


def create_history_entry(demande, action, user=None, description="", metadata=None):
    return HistoriqueDemande.objects.create(
        demande=demande,
        action=action,
        user=user,
        description=description,
        metadata=metadata or {},
    )
