from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework.test import APIClient

from apps.achats.models.demande_achat import DemandeAchat
from apps.achats.models.workflow_history import WorkflowHistory

User = get_user_model()


class AchatsWorkflowApiTests(TestCase):
    def setUp(self):
        for group_name in ["DEMANDEUR", "SERVICE", "BUDGET", "DIRECTION", "MARCHES"]:
            Group.objects.get_or_create(name=group_name)

        self.demandeur = self._create_user("alice", "DEMANDEUR")
        self.service_user = self._create_user("service1", "SERVICE")
        self.budget_user = self._create_user("budget1", "BUDGET")
        self.direction_user = self._create_user("direction1", "DIRECTION")
        self.marches_user = self._create_user("marches1", "MARCHES")

    def _create_user(self, username, group_name):
        user = User.objects.create_user(username=username, password="pwd12345")
        user.groups.add(Group.objects.get(name=group_name))
        return user

    def _client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def _payload(self):
        return {
            "service_demandeur": "Informatique",
            "fonction_demandeur": "Chef de service",
            "activite_ptba": "Projet d'équipement",
            "indicateur_performance": "Disponibilité des équipements",
            "source_financement": "FONDS_MONDIAL",
            "ligne_budgetaire": "L1",
            "budget_estime": "1000.00",
            "devise": "USD",
            "type_marche": "BIENS",
            "nature_activite": "AUTRE",
            "objet_demande": "Acquisition ordinateurs",
            "description": "Achat de postes de travail",
            "region": "Analamanga",
            "adresse_livraison": "Siège UCP",
            "date_debut": "2026-04-01",
            "date_fin": "2026-04-30",
            "urgent": False,
            "justification_urgence": "",
        }

    def _create_demande(self):
        client = self._client_for(self.demandeur)
        response = client.post("/api/achats/demandes/", self._payload(), format="json")
        self.assertEqual(response.status_code, 201)
        return response.json()

    def test_demandeur_can_create_and_list_own_demandes(self):
        created = self._create_demande()

        self.assertTrue(created["numero_demande"].startswith("UCP/DA/"))
        self.assertEqual(created["statut"], DemandeAchat.STATUT_BROUILLON)

        client = self._client_for(self.demandeur)
        response = client.get("/api/achats/demandes/me/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_submit_logs_history_and_service_sees_pending(self):
        created = self._create_demande()

        demandeur_client = self._client_for(self.demandeur)
        submit_response = demandeur_client.post(
            f"/api/achats/demandes/{created['id']}/submit/",
            {},
            format="json",
        )

        self.assertEqual(submit_response.status_code, 200)
        self.assertEqual(submit_response.json()["statut"], DemandeAchat.STATUT_SOUMISE)

        history = WorkflowHistory.objects.filter(demande_id=created["id"])
        self.assertEqual(history.count(), 2)

        service_client = self._client_for(self.service_user)
        pending_response = service_client.get("/api/achats/validations/pending/")

        self.assertEqual(pending_response.status_code, 200)
        self.assertEqual(len(pending_response.json()), 1)

    def test_wrong_role_cannot_validate(self):
        created = self._create_demande()

        demandeur_client = self._client_for(self.demandeur)
        demandeur_client.post(
            f"/api/achats/demandes/{created['id']}/submit/",
            {},
            format="json",
        )

        budget_client = self._client_for(self.budget_user)
        response = budget_client.post(
            "/api/achats/validations/decision/",
            {
                "demande_id": created["id"],
                "decision": "APPROUVE",
                "commentaire": "Tentative invalide",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_service_can_approve_once_only(self):
        created = self._create_demande()

        demandeur_client = self._client_for(self.demandeur)
        demandeur_client.post(
            f"/api/achats/demandes/{created['id']}/submit/",
            {},
            format="json",
        )

        service_client = self._client_for(self.service_user)
        first_response = service_client.post(
            "/api/achats/validations/decision/",
            {
                "demande_id": created["id"],
                "decision": "APPROUVE",
                "commentaire": "Validation service",
            },
            format="json",
        )

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(
            first_response.json()["statut"],
            DemandeAchat.STATUT_VALIDE_SERVICE,
        )

        second_response = service_client.post(
            "/api/achats/validations/decision/",
            {
                "demande_id": created["id"],
                "decision": "APPROUVE",
                "commentaire": "Deuxième tentative",
            },
            format="json",
        )

        self.assertEqual(second_response.status_code, 400)

    def test_budget_approval_requires_funds_status(self):
        created = self._create_demande()

        demandeur_client = self._client_for(self.demandeur)
        demandeur_client.post(
            f"/api/achats/demandes/{created['id']}/submit/",
            {},
            format="json",
        )

        service_client = self._client_for(self.service_user)
        service_client.post(
            "/api/achats/validations/decision/",
            {
                "demande_id": created["id"],
                "decision": "APPROUVE",
                "commentaire": "Validation service",
            },
            format="json",
        )

        budget_client = self._client_for(self.budget_user)
        response = budget_client.post(
            "/api/achats/validations/decision/",
            {
                "demande_id": created["id"],
                "decision": "APPROUVE",
                "commentaire": "Validation budget",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("fonds_statut", response.json())

    def test_full_workflow_until_transmit(self):
        created = self._create_demande()

        demandeur_client = self._client_for(self.demandeur)
        demandeur_client.post(
            f"/api/achats/demandes/{created['id']}/submit/",
            {},
            format="json",
        )

        self._client_for(self.service_user).post(
            "/api/achats/validations/decision/",
            {
                "demande_id": created["id"],
                "decision": "APPROUVE",
                "commentaire": "OK service",
            },
            format="json",
        )

        self._client_for(self.budget_user).post(
            "/api/achats/validations/decision/",
            {
                "demande_id": created["id"],
                "decision": "APPROUVE",
                "commentaire": "OK budget",
                "fonds_statut": "DISPONIBLES",
                "visa": "Visa budget",
            },
            format="json",
        )

        direction_response = self._client_for(self.direction_user).post(
            "/api/achats/validations/decision/",
            {
                "demande_id": created["id"],
                "decision": "APPROUVE",
                "commentaire": "OK direction",
                "visa": "Visa direction",
            },
            format="json",
        )

        self.assertEqual(direction_response.status_code, 200)
        self.assertEqual(
            direction_response.json()["statut"],
            DemandeAchat.STATUT_VALIDE_DIRECTION,
        )

        transmit_response = self._client_for(self.marches_user).post(
            f"/api/achats/demandes/{created['id']}/transmit/",
            {},
            format="json",
        )

        self.assertEqual(transmit_response.status_code, 200)
        self.assertEqual(
            transmit_response.json()["statut"],
            DemandeAchat.STATUT_TRANSMISE_MARCHES,
        )
        self.assertTrue(transmit_response.json()["date_transmission_marches"])
