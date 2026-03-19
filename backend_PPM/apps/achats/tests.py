from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


class TestDemandeAchatApi(TestCase):

    def setUp(self):

        self.user = User.objects.create_user(
            username="alice",
            password="pwd123"
        )

        self.client = APIClient()

        self.client.force_authenticate(self.user)


    def test_add_and_list_demande(self):

        payload = {

            "numero_demande": "DA-TEST-001",

            "service_demandeur": "Informatique",

            "demandeur": self.user.id,

            "fonction_demandeur": "Chef",

            "activite_ptba": "Projet",

            "indicateur_performance": "OK",

            "source_financement": "FONDS_MONDIAL",

            "ligne_budgetaire": "L1",

            "budget_estime": "100.00",

            "devise": "USD",

            "type_marche": "BIENS",

            "nature_activite": "AUTRE",

            "objet_demande": "Serveur",

            "description": "Desc",

            "region": "Antananarivo",

            "adresse_livraison": "Adresse",

            "date_debut": "2026-04-01",

            "date_fin": "2026-04-30",

            "urgent": False,

            "justification_urgence": None,

            "statut": "BROUILLON"
        }

        r = self.client.post(
            "/api/achats/demandes/add/",
            payload,
            format="json"
        )

        self.assertEqual(r.status_code, 200)

        r2 = self.client.get("/api/achats/demandes/list/")

        self.assertEqual(r2.status_code, 200)

        self.assertEqual(
            len(r2.json().get("demandes", [])),
            1
        )