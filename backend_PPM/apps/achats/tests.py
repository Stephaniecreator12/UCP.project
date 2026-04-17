from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import mail
from django.core.management import call_command
from django.test import TestCase

from apps.achats.models import DemandeAchat, ValidationDemande
from apps.achats.services.demande_service import (
    close_demande,
    complete_budget_estimation,
    issue_order,
    receive_demande,
    submit_demande,
    update_demande,
    update_delivery,
)
from apps.achats.services.validation_service import traiter_validation

User = get_user_model()


class AchatsNotificationTests(TestCase):
    def setUp(self):
        super().setUp()
        self.sequence = 0
        mail.outbox = []

    def _create_user(self, username, email, groups=None):
        user = User.objects.create_user(
            username=username,
            email=email,
            password="secret123",
            first_name=username.capitalize(),
        )

        for group_name in groups or []:
            group, _ = Group.objects.get_or_create(name=group_name)
            user.groups.add(group)

        return user

    def _create_demande(self, demandeur, **overrides):
        self.sequence += 1
        defaults = {
            "numero_demande": f"UCP/DA/2026/{self.sequence:04d}",
            "demandeur": demandeur,
            "unite_technique": "Unite test",
            "categorie_besoin": DemandeAchat.CATEGORIE_NOUVEAU_BESOIN,
            "type_demande": DemandeAchat.TYPE_MATERIELS,
            "priorite": DemandeAchat.PRIORITE_NORMAL,
            "objet": "Fournitures bureau",
            "justification": "Besoin de fonctionnement",
            "lien_ptba": "PTBA-2026-01",
            "service_beneficiaire": "Service support",
            "ligne_budgetaire": "2.1.1 Fournitures bureau",
            "source_financement": DemandeAchat.SOURCE_FONDS_MONDIAL,
            "numero_subvention": "SUBV/FM/2026",
        }
        defaults.update(overrides)
        return DemandeAchat.objects.create(**defaults)

    def test_submit_demande_sends_email_to_current_validators(self):
        demandeur = self._create_user("demandeur", "demandeur@example.com")
        self._create_user(
            "chef",
            "chef@example.com",
            groups=["VALIDATEUR_HIERARCHIQUE"],
        )
        demande = self._create_demande(demandeur, statut=DemandeAchat.STATUT_BROUILLON)

        with self.captureOnCommitCallbacks(execute=True):
            submit_demande(demande, demandeur)

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(demande.numero_demande, mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, ["chef@example.com"])

    def test_validation_a_completer_sends_email_to_demandeur(self):
        demandeur = self._create_user("alice", "alice@example.com")
        validateur = self._create_user(
            "hierarchie",
            "hierarchie@example.com",
            groups=["VALIDATEUR_HIERARCHIQUE"],
        )
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
        )

        with self.captureOnCommitCallbacks(execute=True):
            traiter_validation(
                demande,
                validateur,
                ValidationDemande.DECISION_A_COMPLETER,
                commentaire="Document manquant",
            )

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["alice@example.com"])
        self.assertIn("Mise a jour de votre demande", mail.outbox[0].subject)

    def test_final_validation_sends_email_to_demandeur_and_finance(self):
        demandeur = self._create_user("fatou", "fatou@example.com")
        approbateur = self._create_user(
            "coordo",
            "coordo@example.com",
            groups=["APPROBATEUR_NATIONAL"],
        )
        self._create_user(
            "finance",
            "finance@example.com",
            groups=["FINANCE"],
        )
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_APPROBATION_FINALE,
        )

        with self.captureOnCommitCallbacks(execute=True):
            traiter_validation(
                demande,
                approbateur,
                ValidationDemande.DECISION_APPROUVEE,
                commentaire="Accord final",
            )

        self.assertEqual(len(mail.outbox), 1)
        self.assertCountEqual(
            mail.outbox[0].to,
            ["fatou@example.com", "finance@example.com"],
        )
        self.assertIn("Demande validee", mail.outbox[0].subject)

    def test_budget_validation_sends_email_to_demandeur_and_agent_achat(self):
        demandeur = self._create_user("fina", "fina@example.com")
        finance = self._create_user(
            "raf",
            "raf@example.com",
            groups=["FINANCE"],
        )
        self._create_user(
            "agentachat",
            "achat@example.com",
            groups=["AGENT_ACHAT"],
        )
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_VALIDEE,
            ligne_budgetaire="",
            source_financement="",
            numero_subvention="",
        )

        with self.captureOnCommitCallbacks(execute=True):
            complete_budget_estimation(
                demande,
                {
                    "ligne_budgetaire": "2.1.1 Fournitures bureau",
                    "source_financement": DemandeAchat.SOURCE_FONDS_MONDIAL,
                },
                finance,
            )

        self.assertEqual(len(mail.outbox), 1)
        self.assertCountEqual(
            mail.outbox[0].to,
            ["fina@example.com", "achat@example.com"],
        )
        self.assertIn("Budget valide", mail.outbox[0].subject)

    def test_issue_order_sends_email_to_demandeur(self):
        demandeur = self._create_user("noe", "noe@example.com")
        agent = self._create_user(
            "agent",
            "agent@example.com",
            groups=["AGENT_ACHAT"],
        )
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_VALIDEE_BUDGETAIRE,
            numero_engagement_budgetaire="ENG/2026/0001",
        )

        with self.captureOnCommitCallbacks(execute=True):
            issue_order(
                demande,
                {
                    "type_procedure": DemandeAchat.PROCEDURE_BON_DIRECT,
                    "fournisseur_retenu": "Office Plus",
                    "montant_commande": Decimal("280000"),
                    "delai_livraison_contractuel": 5,
                    "conditions_livraison": "Site central",
                    "garantie": "30 jours",
                    "date_bon_commande": date(2026, 4, 2),
                },
                agent,
            )

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["noe@example.com"])
        self.assertIn("Bon de commande emis", mail.outbox[0].subject)

    def test_delivery_update_sends_email_to_demandeur(self):
        demandeur = self._create_user("sam", "sam@example.com")
        agent = self._create_user(
            "logistique",
            "logistique@example.com",
            groups=["AGENT_MARCHE"],
        )
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_EN_COMMANDE,
            numero_bon_commande="UCP/BC/2026/0001",
            fournisseur_retenu="Office Plus",
            montant_commande=Decimal("150000"),
        )

        with self.captureOnCommitCallbacks(execute=True):
            update_delivery(
                demande,
                {
                    "etat_expedition": DemandeAchat.ETAT_EXPEDITION_ARRIVE,
                    "date_arrivee_prevue": date(2026, 4, 4),
                    "date_arrivee_effective": date(2026, 4, 4),
                },
                agent,
            )

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["sam@example.com"])
        self.assertIn("Suivi livraison mis a jour", mail.outbox[0].subject)

    def test_reception_and_closure_send_notifications(self):
        demandeur = self._create_user("mira", "mira@example.com")
        self._create_user(
            "agentops",
            "agentops@example.com",
            groups=["AGENT_ACHAT"],
        )
        agent_marche = self._create_user(
            "agentmarche",
            "agentmarche@example.com",
            groups=["AGENT_MARCHE"],
        )
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_LIVREE,
            numero_bon_commande="UCP/BC/2026/0042",
            fournisseur_retenu="Office Plus",
            statut_reception=DemandeAchat.STATUT_RECEPTION_EN_ATTENTE,
        )

        with self.captureOnCommitCallbacks(execute=True):
            receive_demande(
                demande,
                {
                    "date_reception": date(2026, 4, 2),
                    "receptionnaire": "Mira",
                    "conformite_quantite": DemandeAchat.CONFORMITE_CONFORME,
                    "conformite_qualite": DemandeAchat.CONFORMITE_CONFORME,
                    "observations_reception": "RAS",
                    "statut_reception": DemandeAchat.STATUT_RECEPTION_COMPLETE,
                },
                agent_marche,
            )

        self.assertEqual(len(mail.outbox), 1)
        self.assertCountEqual(
            mail.outbox[0].to,
            ["mira@example.com", "agentops@example.com"],
        )
        self.assertIn("Reception enregistree", mail.outbox[0].subject)

        mail.outbox = []
        demande.refresh_from_db()

        with self.captureOnCommitCallbacks(execute=True):
            close_demande(
                demande,
                {
                    "statut_final": DemandeAchat.STATUT_FINAL_CLOTURE,
                    "niveau_satisfaction": 5,
                    "commentaires_finaux": "Cloture OK",
                    "date_cloture": date(2026, 4, 3),
                },
                demandeur,
            )

        self.assertEqual(len(mail.outbox), 1)
        self.assertCountEqual(
            mail.outbox[0].to,
            ["mira@example.com", "agentops@example.com"],
        )
        self.assertIn("Demande cloturee", mail.outbox[0].subject)

    def test_send_test_email_management_command(self):
        call_command("send_test_email", "audit@example.com")

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["audit@example.com"])
        self.assertIn("Test de notification UCP Achats", mail.outbox[0].subject)

    def test_update_a_completer_increments_version(self):
        demandeur = self._create_user("correction", "correction@example.com")
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_A_COMPLETER,
            version=1,
        )

        updated = update_demande(
            demande,
            {
                "unite_technique": "Unite revisee",
                "categorie_besoin": DemandeAchat.CATEGORIE_NOUVEAU_BESOIN,
                "type_demande": DemandeAchat.TYPE_MATERIELS,
                "priorite": DemandeAchat.PRIORITE_NORMAL,
                "objet": "Fournitures bureau revisees",
                "justification": "Besoin de fonctionnement mis a jour",
                "lien_ptba": "PTBA-2026-01",
                "service_beneficiaire": "Service support",
                "ligne_budgetaire": "2.1.1 Fournitures bureau",
                "source_financement": DemandeAchat.SOURCE_FONDS_MONDIAL,
                "lignes_besoin": [
                    {
                        "designation": "Papier A4",
                        "caracteristiques_techniques": "Ramette 80g",
                        "quantite": 10,
                        "unite": "ramette",
                        "prix_unitaire_estime": Decimal("12000"),
                        "lieu_livraison": "Depot central",
                        "destinataire_final": "Service support",
                    }
                ],
            },
            demandeur,
        )

        updated.refresh_from_db()

        self.assertEqual(updated.version, 2)
        self.assertEqual(updated.historiques.last().metadata.get("previous_version"), 1)
        self.assertEqual(updated.historiques.last().metadata.get("version"), 2)
