#pour vérifier la création et le statut/planning
from django.test import TestCase
from apps.ppm.models.Travaux import Travaux

class TravauxModelTest(TestCase):
    def test_create_travaux(self):
        obj = Travaux.objects.create(intitule="Test", montant_estimatif=1000, agmo="DG", methode_pm="AOI", approches="A1", revue="R1")
        self.assertIsNotNone(obj.id)
