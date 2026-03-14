from config_app.entity.demande_achat import DemandeAchat
from datetime import date
from django.utils import timezone

def creer_demande(service, demandeur, fonction):

    demande = DemandeAchat.objects.create(
        numero_demande=generate_numero_demande(),
        date_demande=date.today(),
        service=service,
        demandeur=demandeur,
        fonction_demandeur=fonction
    )

    return demande

#fonction pour generer le numero unique ("UCP/DA/001")
def generate_numero_demande():
    year = timezone.now().year
    prefix = f"UCP/DA/{year}/"
    last = DemandeAchat.objects.filter(numero_demande__startswith=prefix).order_by("-numero_demande").first()
    last_seq = int(last.numero_demande.split("/")[-1]) if last else 0
    return f"{prefix}{last_seq+1:03d}"