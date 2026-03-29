from decimal import Decimal

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.achats.models import DemandeAchat, DocumentDemande, LigneBesoin

NUMERO_PREFIX = "UCP/DA"


def list_mes_demandes(user):
    return DemandeAchat.objects.filter(demandeur=user).order_by("-created_at")


def _build_numero_demande():
    year = timezone.now().year
    prefix = f"{NUMERO_PREFIX}/{year}/"

    last_demande = (
        DemandeAchat.objects.select_for_update()
        .filter(numero_demande__startswith=prefix)
        .order_by("-id")
        .first()
    )

    sequence = 1
    if last_demande and last_demande.numero_demande:
        try:
            sequence = int(last_demande.numero_demande.split("/")[-1]) + 1
        except (ValueError, IndexError):
            sequence = last_demande.id + 1

    return f"{prefix}{sequence:04d}"


def _create_lignes_besoin(demande, lignes_besoin):
    total = Decimal("0.00")

    for index, ligne in enumerate(lignes_besoin, start=1):
        payload = dict(ligne)

        prix_unitaire = payload.get("prix_unitaire_estime") or Decimal("0.00")
        quantite = payload.get("quantite") or 0
        cout_total = Decimal(prix_unitaire) * Decimal(quantite)

        payload["ordre"] = payload.get("ordre") or index
        payload["cout_total_estime"] = cout_total

        LigneBesoin.objects.create(demande=demande, **payload)
        total += cout_total

    demande.cout_total_estime = total
    demande.save(update_fields=["cout_total_estime", "updated_at"])


def _create_documents(demande, documents):
    for document in documents:
        payload = dict(document)
        DocumentDemande.objects.create(demande=demande, **payload)


@transaction.atomic
def create_demande(validated_data, user):
    lignes_besoin = validated_data.pop("lignes_besoin", [])
    documents = validated_data.pop("documents", [])

    for _ in range(5):
        numero_demande = _build_numero_demande()
        try:
            demande = DemandeAchat.objects.create(
                numero_demande=numero_demande,
                demandeur=user,
                **validated_data,
            )

            if lignes_besoin:
                _create_lignes_besoin(demande, lignes_besoin)

            if documents:
                _create_documents(demande, documents)

            return demande
        except IntegrityError:
            continue

    raise ValidationError(
        {"numero_demande": "Impossible de generer un numero de demande unique."}
    )

def submit_demande(demande, user):
    if demande.demandeur_id != user.id:
        raise ValidationError(
            {"detail": "Seul le demandeur peut soumettre cette demande."}
        )

    if demande.statut != DemandeAchat.STATUT_BROUILLON:
        raise ValidationError(
            {"detail": "Seule une demande en brouillon peut etre soumise."}
        )

    demande.statut = DemandeAchat.STATUT_SOUMISE
    demande.submitted_at = timezone.now()
    demande.save(update_fields=["statut", "submitted_at", "updated_at"])

    return demande
