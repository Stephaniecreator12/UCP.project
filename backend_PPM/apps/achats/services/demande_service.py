from datetime import timedelta
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.achats.models import DemandeAchat, DocumentDemande, LigneBesoin
from apps.achats.models.historique_demande import HistoriqueDemande
from apps.achats.services.history_service import create_history_entry
from apps.achats.services.notification_service import (
    notify_demande_closed,
    notify_demande_submitted,
    notify_delivery_updated,
    notify_order_issued,
    notify_reception_recorded,
)

NUMERO_PREFIX = "UCP/DA"
BON_COMMANDE_PREFIX = "UCP/BC"
AGENT_ACHAT_GROUP = "AGENT_ACHAT"

SUBVENTION_BY_SOURCE = {
    DemandeAchat.SOURCE_FONDS_MONDIAL: "FM",
    DemandeAchat.SOURCE_BANQUE_MONDIALE: "BM",
    DemandeAchat.SOURCE_GAVI: "GAVI",
}


def list_mes_demandes(user):
    return (
        DemandeAchat.objects.filter(demandeur=user)
        .prefetch_related(
            "lignes_besoin",
            "documents",
            "validations__validateur",
            "historiques__user",
        )
        .order_by("-created_at")
    )


def is_agent_achat(user):
    return user.groups.filter(name=AGENT_ACHAT_GROUP).exists()


def list_demandes_a_commander(user):
    if not is_agent_achat(user):
        raise PermissionDenied(
            {"detail": "Accès réservé à l'agent achat."}
        )

    return (
        DemandeAchat.objects.filter(
            statut__in=[
                DemandeAchat.STATUT_VALIDEE,
                DemandeAchat.STATUT_EN_COMMANDE,
                DemandeAchat.STATUT_EN_LIVRAISON,
            ]
        )
        .prefetch_related(
            "lignes_besoin",
            "documents",
            "validations__validateur",
            "historiques__user",
        )
        .order_by("-updated_at", "-created_at")
    )


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


def _build_numero_bon_commande():
    year = timezone.now().year
    prefix = f"{BON_COMMANDE_PREFIX}/{year}/"

    last_order = (
        DemandeAchat.objects.select_for_update()
        .filter(numero_bon_commande__startswith=prefix)
        .order_by("-id")
        .first()
    )

    sequence = 1
    if last_order and last_order.numero_bon_commande:
        try:
            sequence = int(last_order.numero_bon_commande.split("/")[-1]) + 1
        except (ValueError, IndexError):
            sequence = last_order.id + 1

    return f"{prefix}{sequence:04d}"


def _build_numero_subvention(source_financement):
    code = SUBVENTION_BY_SOURCE.get(source_financement, "UCP")
    year = timezone.now().year
    return f"SUBV/{code}/{year}"


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


def add_document_to_demande(demande, data, user):
    _assert_demande_owner(demande, user)

    return DocumentDemande.objects.create(demande=demande, **data)


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
                numero_subvention=_build_numero_subvention(
                    validated_data.get("source_financement")
                ),
                **validated_data,
            )

            if lignes_besoin:
                _create_lignes_besoin(demande, lignes_besoin)

            if documents:
                _create_documents(demande, documents)

            create_history_entry(
                demande=demande,
                action=HistoriqueDemande.ACTION_DEMANDE_CREEE,
                user=user,
                description="La demande a été créée en brouillon.",
                metadata={"statut": demande.statut},
            )

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

    if demande.statut not in [
        DemandeAchat.STATUT_BROUILLON,
        DemandeAchat.STATUT_A_COMPLETER,
    ]:
        raise ValidationError(
            {
                "detail": "Seule une demande en brouillon ou a completer peut etre soumise."
            }
        )

    was_brouillon = demande.statut == DemandeAchat.STATUT_BROUILLON

    demande.statut = DemandeAchat.STATUT_SOUMISE
    if was_brouillon:
        demande.etape_validation_actuelle = DemandeAchat.ETAPE_HIERARCHIQUE
    demande.submitted_at = timezone.now()
    demande.save(
        update_fields=[
            "statut",
            "etape_validation_actuelle",
            "submitted_at",
            "updated_at",
        ]
    )

    create_history_entry(
        demande=demande,
        action=HistoriqueDemande.ACTION_DEMANDE_SOUMISE,
        user=user,
        description="La demande a été soumise dans le circuit de validation.",
        metadata={
            "statut": demande.statut,
            "etape_validation_actuelle": demande.etape_validation_actuelle,
        },
    )
    notify_demande_submitted(demande)

    return demande


def _assert_demande_owner(demande, user):
    if demande.demandeur_id != user.id:
        raise ValidationError(
            {"detail": "Seul le demandeur de cette demande peut effectuer cette action."}
        )


@transaction.atomic
def issue_order(demande, data, user):
    if not is_agent_achat(user):
        raise PermissionDenied(
            {"detail": "Seul l'agent achat peut enregistrer la passation et la commande."}
        )

    if demande.statut != DemandeAchat.STATUT_VALIDEE:
        raise ValidationError(
            {"detail": "Le bon de commande ne peut etre emis qu'apres validation finale."}
        )

    date_bon_commande = data.get("date_bon_commande") or timezone.localdate()
    delai = data["delai_livraison_contractuel"]
    date_livraison_prevue = date_bon_commande + timedelta(days=delai)

    demande.type_procedure = data["type_procedure"]
    demande.fournisseur_retenu = data["fournisseur_retenu"]
    if not demande.numero_bon_commande:
        demande.numero_bon_commande = _build_numero_bon_commande()
    demande.date_bon_commande = date_bon_commande
    demande.montant_commande = data["montant_commande"]
    demande.delai_livraison_contractuel = delai
    demande.date_livraison_prevue = date_livraison_prevue
    demande.date_arrivee_prevue = date_livraison_prevue
    demande.conditions_livraison = data.get("conditions_livraison", "")
    demande.garantie = data.get("garantie", "")
    demande.statut = DemandeAchat.STATUT_EN_COMMANDE
    demande.save(
        update_fields=[
            "type_procedure",
            "fournisseur_retenu",
            "numero_bon_commande",
            "date_bon_commande",
            "montant_commande",
            "delai_livraison_contractuel",
            "date_livraison_prevue",
            "date_arrivee_prevue",
            "conditions_livraison",
            "garantie",
            "statut",
            "updated_at",
        ]
    )

    create_history_entry(
        demande=demande,
        action=HistoriqueDemande.ACTION_COMMANDE_EMISE,
        user=user,
        description="Le bon de commande a été enregistré.",
        metadata={
            "numero_bon_commande": demande.numero_bon_commande,
            "fournisseur_retenu": demande.fournisseur_retenu,
            "montant_commande": str(demande.montant_commande or ""),
        },
    )
    notify_order_issued(demande)
    return demande


def update_delivery(demande, data, user):
    if not is_agent_achat(user):
        raise PermissionDenied(
            {"detail": "Seul l'agent achat peut mettre à jour le suivi de livraison."}
        )

    if demande.statut not in [
        DemandeAchat.STATUT_EN_COMMANDE,
        DemandeAchat.STATUT_EN_LIVRAISON,
        DemandeAchat.STATUT_LIVREE,
    ]:
        raise ValidationError(
            {"detail": "Le suivi livraison n'est pas disponible pour cette demande."}
        )

    etat_expedition = data["etat_expedition"]
    demande.etat_expedition = etat_expedition
    if "date_arrivee_prevue" in data:
        demande.date_arrivee_prevue = data["date_arrivee_prevue"]
    if "date_arrivee_effective" in data:
        demande.date_arrivee_effective = data["date_arrivee_effective"]

    if etat_expedition in [
        DemandeAchat.ETAT_EXPEDITION_ARRIVE,
        DemandeAchat.ETAT_EXPEDITION_PARTIEL,
    ]:
        demande.statut = DemandeAchat.STATUT_LIVREE
    else:
        demande.statut = DemandeAchat.STATUT_EN_LIVRAISON

    demande.save(
        update_fields=[
            "etat_expedition",
            "date_arrivee_prevue",
            "date_arrivee_effective",
            "statut",
            "updated_at",
        ]
    )

    create_history_entry(
        demande=demande,
        action=HistoriqueDemande.ACTION_LIVRAISON_MISE_A_JOUR,
        user=user,
        description="Le suivi de livraison a été mis à jour.",
        metadata={
            "etat_expedition": demande.etat_expedition,
            "date_arrivee_prevue": str(demande.date_arrivee_prevue or ""),
            "date_arrivee_effective": str(demande.date_arrivee_effective or ""),
            "statut": demande.statut,
        },
    )
    notify_delivery_updated(demande)
    return demande


@transaction.atomic
def receive_demande(demande, data, user):
    _assert_demande_owner(demande, user)

    if demande.statut not in [
        DemandeAchat.STATUT_LIVREE,
        DemandeAchat.STATUT_EN_LIVRAISON,
    ]:
        raise ValidationError(
            {"detail": "La reception n'est pas disponible pour cette demande."}
        )

    lignes_payload = data.get("lignes", [])
    if lignes_payload:
        lines_by_id = {
            ligne.id: ligne for ligne in demande.lignes_besoin.all()
        }
        for item in lignes_payload:
            ligne = lines_by_id.get(item["ligne_id"])
            if not ligne:
                raise ValidationError({"lignes": "Une ligne de reception est introuvable."})
            ligne.quantite_recue = item["quantite_recue"]
            ligne.observation_reception = item.get("observation_reception", "")
            ligne.save(update_fields=["quantite_recue", "observation_reception"])

    demande.date_reception = data.get("date_reception") or timezone.localdate()
    demande.receptionnaire = data["receptionnaire"]
    demande.conformite_quantite = data["conformite_quantite"]
    demande.conformite_qualite = data["conformite_qualite"]
    demande.observations_reception = data.get("observations_reception", "")
    demande.statut_reception = data["statut_reception"]
    demande.type_ecart = data.get("type_ecart", "")
    demande.description_ecart = data.get("description_ecart", "")
    demande.action_corrective = data.get("action_corrective", "")
    demande.date_resolution = data.get("date_resolution")
    demande.suivi_resolution = data.get("suivi_resolution", "")

    if demande.statut_reception == DemandeAchat.STATUT_RECEPTION_PARTIELLE:
        demande.statut = DemandeAchat.STATUT_EN_LIVRAISON
    else:
        demande.statut = DemandeAchat.STATUT_LIVREE

    demande.save(
        update_fields=[
            "date_reception",
            "receptionnaire",
            "conformite_quantite",
            "conformite_qualite",
            "observations_reception",
            "statut_reception",
            "type_ecart",
            "description_ecart",
            "action_corrective",
            "date_resolution",
            "suivi_resolution",
            "statut",
            "updated_at",
        ]
    )

    create_history_entry(
        demande=demande,
        action=HistoriqueDemande.ACTION_RECEPTION_ENREGISTREE,
        user=user,
        description="La réception a été enregistrée.",
        metadata={
            "statut_reception": demande.statut_reception,
            "conformite_quantite": demande.conformite_quantite,
            "conformite_qualite": demande.conformite_qualite,
            "statut": demande.statut,
        },
    )
    notify_reception_recorded(demande)
    return demande


def close_demande(demande, data, user):
    _assert_demande_owner(demande, user)

    if demande.statut_reception not in [
        DemandeAchat.STATUT_RECEPTION_COMPLETE,
        DemandeAchat.STATUT_RECEPTION_PARTIELLE,
    ]:
        raise ValidationError(
            {"detail": "La cloture n'est possible qu'apres reception complete ou partielle."}
        )

    demande.statut_final = data["statut_final"]
    demande.niveau_satisfaction = data["niveau_satisfaction"]
    demande.commentaires_finaux = data.get("commentaires_finaux", "")
    demande.date_cloture = data.get("date_cloture") or timezone.localdate()
    demande.statut = DemandeAchat.STATUT_CLOTUREE
    demande.save(
        update_fields=[
            "statut_final",
            "niveau_satisfaction",
            "commentaires_finaux",
            "date_cloture",
            "statut",
            "updated_at",
        ]
    )

    create_history_entry(
        demande=demande,
        action=HistoriqueDemande.ACTION_DEMANDE_CLOTUREE,
        user=user,
        description="La demande a été clôturée.",
        metadata={
            "statut_final": demande.statut_final,
            "niveau_satisfaction": demande.niveau_satisfaction,
        },
    )
    notify_demande_closed(demande)
    return demande
