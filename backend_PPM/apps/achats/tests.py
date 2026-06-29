from datetime import date, datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import mail
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.achats.models import DemandeAchat, Fournisseur, HistoriqueDemande, ValidationDemande
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
            "source_financement": DemandeAchat.SOURCE_SRPS_CS7_FM,
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

    def test_budget_validation_persists_budget_fields_and_moves_to_programmatique(self):
        demandeur = self._create_user("budget", "budget@example.com")
        finance = self._create_user(
            "raf",
            "raf@example.com",
            groups=["FINANCE"],
        )
        self._create_user(
            "programme",
            "programme@example.com",
            groups=["VALIDATEUR_PROGRAMMATIQUE"],
        )
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_BUDGETAIRE,
            ligne_budgetaire="",
            source_financement="",
            numero_subvention="",
            numero_engagement_budgetaire="",
            solde_disponible_ligne_budgetaire=None,
            solde_apres_engagement=None,
        )

        with self.captureOnCommitCallbacks(execute=True):
            traiter_validation(
                demande,
                finance,
                ValidationDemande.DECISION_FAVORABLE,
                commentaire="Budget disponible",
                donnees_etape={
                    "disponibilite_budgetaire": "DISPONIBLE",
                    "conformite_financiere": "CONFORME_MANUEL",
                    "respect_seuils": "SEUIL_RESPECTE",
                    "ligne_budgetaire": "2.1.1 Fournitures bureau",
                    "source_financement": DemandeAchat.SOURCE_SRPS_CS7_FM,
                    "numero_subvention": "MDG-S-MOH-4041",
                    "solde_disponible_ligne_budgetaire": "3200000",
                },
            )

        demande.refresh_from_db()

        self.assertEqual(demande.statut, DemandeAchat.STATUT_SOUMISE)
        self.assertEqual(demande.etape_validation_actuelle, DemandeAchat.ETAPE_PROGRAMMATIQUE)
        self.assertEqual(demande.ligne_budgetaire, "2.1.1 Fournitures bureau")
        self.assertEqual(demande.source_financement, DemandeAchat.SOURCE_SRPS_CS7_FM)
        self.assertEqual(demande.numero_subvention, "MDG-S-MOH-4041")
        self.assertEqual(str(demande.solde_disponible_ligne_budgetaire), "3200000.00")
        self.assertEqual(str(demande.solde_apres_engagement), "3200000.00")
        self.assertTrue(demande.numero_engagement_budgetaire)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["programme@example.com"])
        self.assertIn("À votre tour de valider", mail.outbox[0].subject)

    def test_final_validation_sends_email_to_demandeur_and_agent_achat(self):
        demandeur = self._create_user("fatou", "fatou@example.com")
        approbateur = self._create_user(
            "coordo",
            "coordo@example.com",
            groups=["APPROBATEUR_NATIONAL"],
        )
        self._create_user("agentachat", "achat@example.com", groups=["AGENT_ACHAT"])
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_APPROBATION_FINALE,
            ligne_budgetaire="2.1.1 Fournitures bureau",
            source_financement=DemandeAchat.SOURCE_SRPS_CS7_FM,
            numero_subvention="MDG-S-MOH-4041",
            numero_engagement_budgetaire="ENG/2026/0001",
            solde_disponible_ligne_budgetaire=Decimal("3200000.00"),
            solde_apres_engagement=Decimal("2800000.00"),
        )

        with self.captureOnCommitCallbacks(execute=True):
            traiter_validation(
                demande,
                approbateur,
                ValidationDemande.DECISION_APPROUVEE,
                commentaire="Accord final",
            )

        demande.refresh_from_db()

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(demande.statut, DemandeAchat.STATUT_VALIDEE_BUDGETAIRE)
        self.assertCountEqual(
            mail.outbox[0].to,
            ["fatou@example.com", "achat@example.com"],
        )
        self.assertIn("passation", mail.outbox[0].subject.lower())

    def test_complete_budget_estimation_is_disabled_after_validation_flow_change(self):
        demandeur = self._create_user("noro", "noro@example.com")
        finance = self._create_user(
            "financelegacy",
            "financelegacy@example.com",
            groups=["FINANCE"],
        )
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_VALIDEE,
            etape_validation_actuelle=DemandeAchat.ETAPE_TERMINEE,
        )

        with self.assertRaisesMessage(
            ValidationError,
            "La validation budgetaire ne se fait plus apres les 5 validations.",
        ):
            complete_budget_estimation(
                demande,
                {
                    "ligne_budgetaire": "2.1.1 Fournitures bureau",
                    "source_financement": DemandeAchat.SOURCE_SRPS_CS7_FM,
                },
                finance,
            )

    def test_issue_order_sends_email_to_demandeur_and_supplier(self):
        demandeur = self._create_user("noe", "noe@example.com")
        agent = self._create_user(
            "agent",
            "agent@example.com",
            groups=["AGENT_ACHAT"],
        )
        fournisseur = Fournisseur.objects.create(
            nom="Office Plus",
            email="contact@officeplus.test",
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
                    "fournisseur": fournisseur,
                    "email_fournisseur": fournisseur.email,
                    "montant_commande": Decimal("280000"),
                    "delai_livraison_contractuel": 5,
                    "conditions_livraison": "Site central",
                    "garantie": "30 jours",
                    "date_bon_commande": date(2026, 4, 2),
                },
                agent,
            )

        demande.refresh_from_db()

        self.assertEqual(demande.email_fournisseur, "contact@officeplus.test")
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].to, ["noe@example.com"])
        self.assertIn("Bon de commande emis", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[1].to, ["contact@officeplus.test"])
        self.assertIn("Bon de commande UCP", mail.outbox[1].subject)

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

    def test_check_delayed_demandes_sends_24h_reminder(self):
        demandeur = self._create_user("lateuser", "lateuser@example.com")
        self._create_user(
            "chefretard",
            "chefretard@example.com",
            groups=["VALIDATEUR_HIERARCHIQUE"],
        )
        fixed_now = timezone.make_aware(datetime(2026, 5, 6, 10, 0, 0))
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
            priorite=DemandeAchat.PRIORITE_URGENT,
        )
        DemandeAchat.objects.filter(pk=demande.pk).update(
            updated_at=fixed_now - timedelta(hours=25),
        )

        with patch(
            "apps.achats.management.commands.check_delayed_demandes.timezone.now",
            return_value=fixed_now,
        ):
            call_command("check_delayed_demandes")

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["chefretard@example.com"])
        self.assertIn("24h", mail.outbox[0].subject)
        self.assertTrue(
            HistoriqueDemande.objects.filter(
                demande=demande,
                action=HistoriqueDemande.ACTION_RAPPEL_VALIDATION_24H,
            ).exists()
        )

    def test_check_delayed_demandes_sends_budget_reminder_to_finance(self):
        demandeur = self._create_user("budgetlate", "budgetlate@example.com")
        self._create_user(
            "rafretard",
            "rafretard@example.com",
            groups=["FINANCE"],
        )
        fixed_now = timezone.make_aware(datetime(2026, 5, 6, 10, 0, 0))
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_BUDGETAIRE,
            priorite=DemandeAchat.PRIORITE_URGENT,
        )
        DemandeAchat.objects.filter(pk=demande.pk).update(
            updated_at=fixed_now - timedelta(hours=25),
        )

        with patch(
            "apps.achats.management.commands.check_delayed_demandes.timezone.now",
            return_value=fixed_now,
        ):
            call_command("check_delayed_demandes")

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["rafretard@example.com"])

    def test_check_delayed_demandes_sends_correction_reminder_to_demandeur(self):
        demandeur = self._create_user("correctionlate", "correctionlate@example.com")
        self._create_user(
            "chefcorrection",
            "chefcorrection@example.com",
            groups=["VALIDATEUR_HIERARCHIQUE"],
        )
        fixed_now = timezone.make_aware(datetime(2026, 5, 6, 10, 0, 0))
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_A_COMPLETER,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
            priorite=DemandeAchat.PRIORITE_URGENT,
        )
        DemandeAchat.objects.filter(pk=demande.pk).update(
            updated_at=fixed_now - timedelta(hours=25),
        )

        with patch(
            "apps.achats.management.commands.check_delayed_demandes.timezone.now",
            return_value=fixed_now,
        ):
            call_command("check_delayed_demandes")

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["correctionlate@example.com"])

    def test_check_delayed_demandes_does_not_resend_same_24h_reminder(self):
        demandeur = self._create_user("onceonly", "onceonly@example.com")
        self._create_user(
            "chefunique",
            "chefunique@example.com",
            groups=["VALIDATEUR_HIERARCHIQUE"],
        )
        fixed_now = timezone.make_aware(datetime(2026, 5, 6, 10, 0, 0))
        demande = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
            priorite=DemandeAchat.PRIORITE_URGENT,
        )
        DemandeAchat.objects.filter(pk=demande.pk).update(
            updated_at=fixed_now - timedelta(hours=25),
        )

        with patch(
            "apps.achats.management.commands.check_delayed_demandes.timezone.now",
            return_value=fixed_now,
        ):
            call_command("check_delayed_demandes")
            call_command("check_delayed_demandes")

        self.assertEqual(len(mail.outbox), 1)

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
                "source_financement": DemandeAchat.SOURCE_SRPS_CS7_FM,
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


class DashboardScopeApiTests(TestCase):
    def setUp(self):
        super().setUp()
        self.sequence = 0
        self.client = APIClient()

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
            "objet": f"Objet {self.sequence}",
            "justification": "Besoin de fonctionnement",
            "lien_ptba": "PTBA-2026-01",
            "service_beneficiaire": "Service support",
            "ligne_budgetaire": "2.1.1 Fournitures bureau",
            "source_financement": DemandeAchat.SOURCE_SRPS_CS7_FM,
            "numero_subvention": "SUBV/FM/2026",
        }
        defaults.update(overrides)
        return DemandeAchat.objects.create(**defaults)

    def test_scope_all_is_available_for_standard_user(self):
        demandeur = self._create_user("simple", "simple@example.com")
        autre = self._create_user("autre", "autre@example.com")
        visible = self._create_demande(
            autre,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
        )
        self._create_demande(
            autre,
            statut=DemandeAchat.STATUT_BROUILLON,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
        )
        self.client.force_authenticate(demandeur)

        response = self.client.get("/api/achats/demandes/?scope=all")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["numero_demande"], visible.numero_demande)

    def test_scope_all_keeps_own_drafts_visible_but_hides_other_drafts(self):
        demandeur = self._create_user("simpleall", "simpleall@example.com")
        autre = self._create_user("autreglobal", "autreglobal@example.com")
        own_draft = self._create_demande(
            demandeur,
            statut=DemandeAchat.STATUT_BROUILLON,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
        )
        visible = self._create_demande(
            autre,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
        )
        self._create_demande(
            autre,
            statut=DemandeAchat.STATUT_BROUILLON,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
        )
        self.client.force_authenticate(demandeur)

        response = self.client.get("/api/achats/demandes/?scope=all")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 2)
        self.assertCountEqual(
            [item["numero_demande"] for item in payload],
            [own_draft.numero_demande, visible.numero_demande],
        )

    def test_standard_user_can_view_other_demande_detail(self):
        demandeur = self._create_user("simpledetail", "simpledetail@example.com")
        autre = self._create_user("voisin", "voisin@example.com")
        demande = self._create_demande(
            autre,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
        )
        self.client.force_authenticate(demandeur)

        response = self.client.get(f"/api/achats/demandes/{demande.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["numero_demande"], demande.numero_demande)

    def test_scope_all_returns_global_non_draft_dossiers_for_finance(self):
        finance = self._create_user("finance", "finance@example.com", groups=["FINANCE"])
        demandeur_a = self._create_user("alice", "alice@example.com")
        demandeur_b = self._create_user("bob", "bob@example.com")

        visible = self._create_demande(
            demandeur_a,
            statut=DemandeAchat.STATUT_SOUMISE,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
        )
        also_visible = self._create_demande(
            demandeur_b,
            statut=DemandeAchat.STATUT_CLOTUREE,
            etape_validation_actuelle=DemandeAchat.ETAPE_TERMINEE,
        )
        self._create_demande(
            demandeur_b,
            statut=DemandeAchat.STATUT_BROUILLON,
            etape_validation_actuelle=DemandeAchat.ETAPE_HIERARCHIQUE,
        )

        self.client.force_authenticate(finance)
        response = self.client.get("/api/achats/demandes/?scope=all")

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(len(payload), 2)
        self.assertCountEqual(
            [item["numero_demande"] for item in payload],
            [visible.numero_demande, also_visible.numero_demande],
        )
        self.assertCountEqual(
            [item["demandeur_nom"] for item in payload],
            [demandeur_a.first_name, demandeur_b.first_name],
        )
