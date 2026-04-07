#pour vérifier la création et le statut/planning
from django.test import Client, TestCase
from apps.ppm.models.Travaux import Travaux

class TravauxModelTest(TestCase):
    def test_create_travaux(self):
        obj = Travaux.objects.create(intitule="Test", montant_estimatif=1000, agmo="DG", methode_pm="AOI", approches="A1", revue="R1")
        self.assertIsNotNone(obj.id)


class PpmListViewsTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_travaux_list_endpoint_returns_200(self):
        response = self.client.get("/api/ppm/travaux/list/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("travaux", response.json())

    def test_consultances_list_endpoint_returns_200(self):
        response = self.client.get("/api/ppm/consultances/list/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("consultance", response.json())
