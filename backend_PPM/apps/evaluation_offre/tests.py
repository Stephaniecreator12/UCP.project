from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.exceptions import ValidationError

from apps.evaluation_offre.models import EvaluationOffre, EvaluationSeanceAssignation
from apps.evaluation_offre.services.evaluation_service import assigner_evaluateurs_seance
from apps.ouverture_offre.models import OffreOuverture, SeanceOuverture


User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="sender@example.test",
    FRONTEND_APP_URL="http://frontend.test",
    EVALUATION_NOTIFICATION_EMAILS_ENABLED=True,
    EVALUATION_EMAIL_SUBJECT_PREFIX="[UCP Evaluation] ",
)
class EvaluationNotificationTests(TestCase):
    def setUp(self):
        mail.outbox = []
        self.secretaire = User.objects.create_user(
            email="secretaire-eval@example.test",
            password="secret123",
            full_name="Secretaire Eval",
        )
        self.seance = SeanceOuverture.objects.create(
            reference_dossier="DAO/2026/EVAL",
            objet_dossier="Evaluation test",
            secretaire=self.secretaire,
            statut=SeanceOuverture.Statut.VALIDEE,
        )
        self.offre = OffreOuverture.objects.create(
            seance=self.seance,
            ordre_passage=1,
            nom_soumissionnaire="Soumissionnaire A",
        )

    def _create_evaluators(self):
        return [
            User.objects.create_user(
                email=f"eval-{idx}@example.test",
                password="secret123",
                full_name=f"Evaluateur {idx}",
            )
            for idx in range(1, 4)
        ]

    def test_assigner_evaluateurs_seance_sends_one_email_per_evaluator(self):
        evaluators = self._create_evaluators()

        result = assigner_evaluateurs_seance(
            self.seance.id,
            self.secretaire,
            evaluateur_ids=[user.id for user in evaluators],
        )

        self.assertEqual(result["emails_envoyes"], 3)
        self.assertEqual(len(mail.outbox), 3)
        self.assertEqual(EvaluationSeanceAssignation.objects.count(), 3)
        self.assertEqual(EvaluationOffre.objects.count(), 3)
        self.assertEqual(
            {message.to[0] for message in mail.outbox},
            {user.email for user in evaluators},
        )
        self.assertTrue(
            all(message.subject.startswith("[UCP Evaluation] ") for message in mail.outbox)
        )
        self.assertIn(
            "http://frontend.test/personnel/evaluation/login",
            mail.outbox[0].alternatives[0][0],
        )
        self.assertIn("Mot de passe", mail.outbox[0].body)

    def test_assigner_evaluateurs_seance_blocks_evaluator_without_email(self):
        evaluators = self._create_evaluators()
        missing_email_user = User.objects.create_user(
            email="eval-without-email@example.test",
            password="secret123",
        )
        User.objects.filter(pk=missing_email_user.pk).update(email="")

        with self.assertRaises(ValidationError):
            assigner_evaluateurs_seance(
                self.seance.id,
                self.secretaire,
                evaluateur_ids=[
                    evaluators[0].id,
                    evaluators[1].id,
                    missing_email_user.id,
                ],
            )

        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(EvaluationSeanceAssignation.objects.count(), 0)
        self.assertEqual(EvaluationOffre.objects.count(), 0)
