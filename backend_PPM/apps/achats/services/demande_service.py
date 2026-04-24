from datetime import timedelta
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.achats.models import DemandeAchat, DocumentDemande, LigneBesoin
from apps.achats.models.historique_demande import HistoriqueDemande
from apps.achats.services.history_service import create_history_entry
from apps.achats.services.notification_service import (
    notify_budget_validated,
    notify_demande_closed,
    notify_demande_submitted,
    notify_delivery_updated,
    notify_order_issued,
    notify_reception_issue_resolved,
    notify_reception_recorded,
)

NUMERO_PREFIX = "UCP/DA"
BON_COMMANDE_PREFIX = "UCP/BC"
ENGAGEMENT_PREFIX = "ENG"
AGENT_ACHAT_GROUP = "AGENT_ACHAT"
LOGISTIQUE_GROUP = "LOGISTIQUE"
AGENT_MARCHE_GROUP = "AGENT_MARCHE"
MARCHES_GROUP = "MARCHES"
FINANCE_GROUPS = ["FINANCE", "RAF", "VALIDATEUR_BUDGETAIRE"]
MARCHE_GROUPS = [AGENT_MARCHE_GROUP, MARCHES_GROUP, LOGISTIQUE_GROUP]

BUDGET_MOCK_BY_LINE = {
    "2.1.1 Fournitures bureau": {
        DemandeAchat.SOURCE_SRPS_CS7_FM: Decimal("3200000.00"),
        DemandeAchat.SOURCE_PARN2_BM: Decimal("2800000.00"),
        DemandeAchat.SOURCE_RSS3_GAVI: Decimal("1800000.00"),
    },
    "2.2.1 Materiel informatique": {
        DemandeAchat.SOURCE_SRPS_CS7_FM: Decimal("9500000.00"),
        DemandeAchat.SOURCE_PARN2_BM: Decimal("12000000.00"),
        DemandeAchat.SOURCE_RSS3_GAVI: Decimal("4500000.00"),
    },
    "3.1.1 Services": {
        DemandeAchat.SOURCE_SRPS_CS7_FM: Decimal("6400000.00"),
        DemandeAchat.SOURCE_PARN2_BM: Decimal("7100000.00"),
        DemandeAchat.SOURCE_RSS3_GAVI: Decimal("3900000.00"),
    },
}

DEFAULT_BUDGET_BALANCE_BY_SOURCE = {
    DemandeAchat.SOURCE_SRPS_CS7_FM: Decimal("3000000.00"),
    DemandeAchat.SOURCE_PARN2_BM: Decimal("4500000.00"),
    DemandeAchat.SOURCE_RSS3_GAVI: Decimal("2200000.00"),
}

SUBVENTION_BY_SOURCE = {
    DemandeAchat.SOURCE_SRPS_CS7_FM: "MDG - S MOH 4041",
    DemandeAchat.SOURCE_RSS3_GAVI: "MDG - HSS - 3",
    DemandeAchat.SOURCE_FAE_GAVI: "MDG - FAE",
    DemandeAchat.SOURCE_CDS_GAVI: "MDG - COVID19 - CDS",
    DemandeAchat.SOURCE_VAR_GAVI: "MDG - VAR Camp",
    DemandeAchat.SOURCE_PARN2_BM: "P175110, PAD 4924",
    DemandeAchat.SOURCE_PPSB_BM: "P174903",
}


def list_mes_demandes(user):
    qs = DemandeAchat.objects.all()
    filters = Q(demandeur=user)

    if is_agent_marche(user):
        # Marche needs to see everything that is ordered, shipped or received.
        filters |= Q(statut__in=[
            DemandeAchat.STATUT_EN_COMMANDE, 
            DemandeAchat.STATUT_EN_LIVRAISON, 
            DemandeAchat.STATUT_LIVREE, 
            DemandeAchat.STATUT_CLOTUREE
        ])
    
    if is_agent_achat(user):
        filters |= Q(statut__in=[
            DemandeAchat.STATUT_VALIDEE_BUDGETAIRE,
            DemandeAchat.STATUT_EN_COMMANDE, 
            DemandeAchat.STATUT_EN_LIVRAISON, 
        ])
        
    if is_finance(user):
        filters |= Q(statut__in=[
            DemandeAchat.STATUT_SOUMISE,
            DemandeAchat.STATUT_VALIDEE,
            DemandeAchat.STATUT_VALIDEE_BUDGETAIRE,
            DemandeAchat.STATUT_EN_COMMANDE,
            DemandeAchat.STATUT_EN_LIVRAISON,
            DemandeAchat.STATUT_LIVREE,
            DemandeAchat.STATUT_CLOTUREE,
        ])
        
    qs = qs.filter(filters)

    from django.db.models import Prefetch
    from apps.achats.models import ValidationDemande, HistoriqueDemande

    return (
        qs.select_related("demandeur")
        .prefetch_related(
            "demandeur__groups",
            "lignes_besoin",
            "documents",
            Prefetch(
                "validations",
                queryset=ValidationDemande.objects.select_related("validateur"),
            ),
            Prefetch(
                "historiques",
                queryset=HistoriqueDemande.objects.select_related("user"),
            ),
        )
        .order_by("-created_at")
    )


def is_agent_achat(user):
    return user.groups.filter(name=AGENT_ACHAT_GROUP).exists()

def is_agent_marche(user):
    return user.groups.filter(name__in=MARCHE_GROUPS).exists()

def is_logistique(user):
    return is_agent_marche(user)


def is_finance(user):
    return user.groups.filter(name__in=FINANCE_GROUPS).exists()


def list_demandes_a_commander(user):
    if not is_agent_achat(user):
        raise PermissionDenied(
            {"detail": "Accès réservé à l'agent achat."}
        )

    from django.db.models import Prefetch
    from apps.achats.models import ValidationDemande, HistoriqueDemande

    return (
        DemandeAchat.objects.filter(
            statut__in=[
                DemandeAchat.STATUT_VALIDEE_BUDGETAIRE,
                DemandeAchat.STATUT_EN_COMMANDE,
                DemandeAchat.STATUT_EN_LIVRAISON,
            ]
        )
        .select_related("demandeur")
        .prefetch_related(
            "demandeur__groups",
            "lignes_besoin",
            "documents",
            Prefetch(
                "validations",
                queryset=ValidationDemande.objects.select_related("validateur"),
            ),
            Prefetch(
                "historiques",
                queryset=HistoriqueDemande.objects.select_related("user"),
            ),
        )
        .order_by("-updated_at", "-created_at")
    )


def list_demandes_budgetaires(user):
    if not is_finance(user):
        raise PermissionDenied({"detail": "Accès réservé au service finance."})

    from django.db.models import Prefetch
    from apps.achats.models import ValidationDemande, HistoriqueDemande

    return (
        DemandeAchat.objects.filter(
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_BUDGETAIRE,
        )
        .select_related("demandeur")
        .prefetch_related(
            "demandeur__groups",
            "lignes_besoin",
            "documents",
            Prefetch(
                "validations",
                queryset=ValidationDemande.objects.select_related("validateur"),
            ),
            Prefetch(
                "historiques",
                queryset=HistoriqueDemande.objects.select_related("user"),
            ),
        )
        .order_by("-submitted_at", "-created_at")
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
    if not source_financement:
        return ""
    return SUBVENTION_BY_SOURCE.get(source_financement, "NON_DEFINI")


def _build_numero_engagement_budgetaire():
    year = timezone.now().year
    prefix = f"{ENGAGEMENT_PREFIX}/{year}/"

    last_engagement = (
        DemandeAchat.objects.select_for_update()
        .filter(numero_engagement_budgetaire__startswith=prefix)
        .order_by("-id")
        .first()
    )

    sequence = 1
    if last_engagement and last_engagement.numero_engagement_budgetaire:
        try:
            sequence = int(last_engagement.numero_engagement_budgetaire.split("/")[-1]) + 1
        except (ValueError, IndexError):
            sequence = last_engagement.id + 1

    return f"{prefix}{sequence:04d}"


def _get_mock_budget_balance(ligne_budgetaire, source_financement):
    line_budget = BUDGET_MOCK_BY_LINE.get((ligne_budgetaire or "").strip(), {})
    if source_financement in line_budget:
        return line_budget[source_financement]
    return DEFAULT_BUDGET_BALANCE_BY_SOURCE.get(
        source_financement, Decimal("2500000.00")
    )


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
    if demande.demandeur_id != user.id and not is_agent_marche(user):
        raise ValidationError(
            {"detail": "Seul le demandeur ou le service marche peut ajouter un document."}
        )

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

@transaction.atomic
def update_demande(demande, validated_data, user):
    _assert_demande_owner(demande, user)

    if demande.statut not in [DemandeAchat.STATUT_BROUILLON, DemandeAchat.STATUT_A_COMPLETER]:
        raise ValidationError({"detail": "Seule une demande en brouillon ou a completer peut etre modifiee."})

    previous_version = demande.version
    should_increment_version = demande.statut == DemandeAchat.STATUT_A_COMPLETER
    lignes_besoin = validated_data.pop("lignes_besoin", None)
    documents = validated_data.pop("documents", [])

    for field, value in validated_data.items():
        setattr(demande, field, value)

    if "source_financement" in validated_data:
        demande.numero_subvention = _build_numero_subvention(validated_data["source_financement"])

    if should_increment_version:
        demande.version = previous_version + 1

    demande.save()

    if lignes_besoin is not None and isinstance(lignes_besoin, list):
        demande.lignes_besoin.all().delete()
        _create_lignes_besoin(demande, lignes_besoin)

    if documents:
        _create_documents(demande, documents)

    create_history_entry(
        demande=demande,
        action=HistoriqueDemande.ACTION_DEMANDE_CREEE,
        user=user,
        description=(
            f"La demande a été mise à jour (version {demande.version})."
            if should_increment_version
            else "La demande a été mise à jour."
        ),
        metadata={
            "statut": demande.statut,
            "previous_version": previous_version,
            "version": demande.version,
        },
    )
    return demande


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
def complete_budget_estimation(demande, data, user):
    if not is_finance(user):
        raise PermissionDenied(
            {"detail": "Seul le service finance peut compléter l'estimation budgétaire."}
        )

    del demande, data

    raise ValidationError(
        {
            "detail": (
                "La validation budgetaire ne se fait plus apres les 5 validations. "
                "Elle est integree a l'etape budgetaire du circuit de validation."
            )
        }
    )


@transaction.atomic
def issue_order(demande, data, user):
    if not is_agent_achat(user):
        raise PermissionDenied(
            {"detail": "Seul l'agent achat peut enregistrer la passation et la commande."}
        )

    if demande.statut != DemandeAchat.STATUT_VALIDEE_BUDGETAIRE:
        raise ValidationError(
            {
                "detail": "Le bon de commande ne peut etre emis qu'apres validation budgetaire."
            }
        )

    fournisseur_instance = data["fournisseur"]
    date_bon_commande = data.get("date_bon_commande") or timezone.localdate()
    delai = data["delai_livraison_contractuel"]
    date_livraison_prevue = date_bon_commande + timedelta(days=delai)

    demande.type_procedure = data["type_procedure"]
    demande.fournisseur = fournisseur_instance
    demande.fournisseur_retenu = fournisseur_instance.nom
    demande.email_fournisseur = fournisseur_instance.email
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
            "fournisseur",
            "fournisseur_retenu",
            "email_fournisseur",
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
            "email_fournisseur": demande.email_fournisseur,
            "montant_commande": str(demande.montant_commande or ""),
        },
    )
    notify_order_issued(demande)
    return demande


def update_delivery(demande, data, user):
    if not is_agent_marche(user):
        raise PermissionDenied(
            {"detail": "Seul l'agent marche peut mettre a jour le suivi d'expedition."}
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
    if not is_agent_marche(user):
        raise ValidationError(
            {"detail": "Seul le service marche peut enregistrer la reception et les ecarts."}
        )

    if demande.statut not in [
        DemandeAchat.STATUT_LIVREE,
        DemandeAchat.STATUT_EN_LIVRAISON,
        DemandeAchat.STATUT_EN_COMMANDE,
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
    issue_detected = (
        demande.conformite_quantite != DemandeAchat.CONFORMITE_CONFORME
        or demande.conformite_qualite != DemandeAchat.CONFORMITE_CONFORME
    )

    if not issue_detected:
        for ligne in demande.lignes_besoin.all():
            expected_quantity = ligne.quantite or 0
            received_quantity = ligne.quantite_recue or 0
            if expected_quantity != received_quantity:
                issue_detected = True
                break

    if issue_detected:
        demande.statut_reception = DemandeAchat.STATUT_RECEPTION_ECART_DETECTE
        demande.type_ecart = data.get("type_ecart", "")
        demande.description_ecart = data.get("description_ecart", "")
        demande.action_corrective = data.get("action_corrective", "")
        demande.date_resolution = None
        demande.suivi_resolution = ""
    else:
        demande.statut_reception = DemandeAchat.STATUT_RECEPTION_COMPLETE
        demande.type_ecart = ""
        demande.description_ecart = ""
        demande.action_corrective = ""
        demande.date_resolution = None
        demande.suivi_resolution = ""

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


@transaction.atomic
def resolve_reception_issue(demande, data, user):
    if not is_agent_marche(user):
        raise ValidationError(
            {"detail": "Seul le service marche peut enregistrer la resolution d'un ecart."}
        )

    if demande.statut_reception != DemandeAchat.STATUT_RECEPTION_ECART_DETECTE:
        raise ValidationError(
            {"detail": "Aucun ecart en attente de resolution pour cette demande."}
        )

    demande.date_resolution = data.get("date_resolution") or timezone.localdate()
    demande.suivi_resolution = data["suivi_resolution"]
    demande.statut_reception = DemandeAchat.STATUT_RECEPTION_ECART_RESOLU
    demande.statut = DemandeAchat.STATUT_LIVREE
    demande.save(
        update_fields=[
            "date_resolution",
            "suivi_resolution",
            "statut_reception",
            "statut",
            "updated_at",
        ]
    )

    create_history_entry(
        demande=demande,
        action=HistoriqueDemande.ACTION_ECART_RESOLU,
        user=user,
        description="L'ecart de reception a ete resolu.",
        metadata={
            "type_ecart": demande.type_ecart,
            "action_corrective": demande.action_corrective,
            "date_resolution": str(demande.date_resolution or ""),
            "statut_reception": demande.statut_reception,
        },
    )
    notify_reception_issue_resolved(demande)
    return demande


def close_demande(demande, data, user):
    _assert_demande_owner(demande, user)

    if demande.statut_reception not in [
        DemandeAchat.STATUT_RECEPTION_COMPLETE,
        DemandeAchat.STATUT_RECEPTION_ECART_RESOLU,
        DemandeAchat.STATUT_RECEPTION_PARTIELLE,
    ]:
        raise ValidationError(
            {"detail": "La cloture n'est possible qu'apres reception complete ou apres resolution d'un ecart."}
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
