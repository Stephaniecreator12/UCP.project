from django.test import TestCase
from apps.achats.models.demande_achat import DemandeAchat

class DemandeTest(TestCase):

    def test_creation_demande(self):
        demande = DemandeAchat.objects.create(
            objet_demande="achat ordinateur"
        )

        self.assertEqual(demande.objet_demande, "achat ordinateur")