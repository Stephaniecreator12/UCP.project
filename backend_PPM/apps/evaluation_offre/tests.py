from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.ouverture_offre.models import SeanceOuverture, OffreOuverture
from apps.evaluation_offre.models import EvaluationSeanceAssignation, EvaluationOffre
from apps.evaluation_offre.services.validation_access_service import (
    generate_evaluation_password,
    issue_seance_password,
    authenticate_seance_assignation,
    issue_evaluation_password,
    get_evaluation_with_password,
)

User = get_user_model()


class EvaluationOffreTests(TestCase):
    def setUp(self):
        self.secretaire = User.objects.create_user(
            username="secretaire",
            email="secretaire@example.test",
            password="secret123",
        )
        self.president = User.objects.create_user(
            username="president",
            email="president@example.test",
            password="secret123",
        )
        self.seance = SeanceOuverture.objects.create(
            reference_dossier="DAO/2026/9999",
            objet_dossier="Seance de test evaluation",
            secretaire=self.secretaire,
            president=self.president,
            statut=SeanceOuverture.Statut.EN_VALIDATION_MEMBRES,
        )
        self.offre = OffreOuverture.objects.create(
            seance=self.seance,
            ordre_passage=1,
            nom_soumissionnaire="Test Soumissionnaire",
            montant_global=15000000.00,
        )
        self.evaluateur = User.objects.create_user(
            username="evaluateur1",
            email="evaluateur1@example.test",
            password="evalpassword123",
        )

    def test_generate_evaluation_password_structure(self):
        password = generate_evaluation_password(
            reference="DAO/2026/9999",
            participant_key="E1"
        )
        self.assertTrue(password.startswith("DAO20269-E1-"))
        self.assertEqual(len(password), 8 + 1 + 2 + 1 + 6)

    def test_seance_assignation_password_flow(self):
        assignation = EvaluationSeanceAssignation.objects.create(
            seance=self.seance,
            evaluateur=self.evaluateur,
            evaluateur_email=self.evaluateur.email,
        )
        password = issue_seance_password(assignation)
        self.assertTrue(assignation.evaluation_password_hash)
        self.assertIsNotNone(assignation.evaluation_password_generated_at)

        # Authenticate successfully with correct password
        authenticated = authenticate_seance_assignation(
            email=self.evaluateur.email,
            password=password,
            seance_id=self.seance.id,
        )
        self.assertEqual(authenticated.id, assignation.id)

    def test_evaluation_password_flow(self):
        evaluation = EvaluationOffre.objects.create(
            offre=self.offre,
            evaluateur=self.evaluateur,
            evaluateur_email=self.evaluateur.email,
        )
        password = issue_evaluation_password(evaluation)
        self.assertTrue(evaluation.evaluation_password_hash)

        # Verify access using get_evaluation_with_password
        retrieved = get_evaluation_with_password(
            offre_id=self.offre.id,
            email=self.evaluateur.email,
            password=password,
        )
        self.assertEqual(retrieved.id, evaluation.id)
