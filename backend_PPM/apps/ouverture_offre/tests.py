from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.ouverture_offre.models import MembreSeance, SeanceOuverture
from apps.ouverture_offre.services.notification_service import (
    notify_members_validation_requested,
    notify_president_validation_requested,
)
from apps.ouverture_offre.views.seance_view import (
    seance_validation_access,
    seance_validation_decision,
)
from apps.ouverture_offre.views.user_view import available_users


User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_APP_URL="http://frontend.test",
    OUVERTURE_NOTIFICATION_EMAILS_ENABLED=True,
)
class OuvertureNotificationTests(TestCase):
    def setUp(self):
        mail.outbox = []
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
        self.membre = User.objects.create_user(
            username="membre",
            email="membre@example.test",
            password="normal-member-password",
        )
        self.seance = SeanceOuverture.objects.create(
            reference_dossier="DAO/2026/0001",
            objet_dossier="Test ouverture",
            secretaire=self.secretaire,
            president=self.president,
            statut=SeanceOuverture.Statut.EN_VALIDATION_MEMBRES,
        )
        self.participation = MembreSeance.objects.create(
            seance=self.seance,
            utilisateur=self.membre,
            nom_prenom="Membre Test",
        )

    def test_member_validation_email_uses_validation_login_page(self):
        with self.captureOnCommitCallbacks(execute=True):
            sent_count = notify_members_validation_requested(self.seance)

        self.assertEqual(sent_count, 1)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        expected_path = (
            "http://frontend.test/login"
            f"?validation=ouverture&seance={self.seance.id}"
            "&role=membre&email=membre%40example.test"
        )

        self.assertEqual(message.to, ["membre@example.test"])
        self.assertIn(expected_path, message.body)
        self.assertIn("Mot de passe de validation :", message.body)
        self.assertIn(expected_path.replace("&", "&amp;"), message.alternatives[0][0])

    def test_each_validator_receives_a_different_dao_code(self):
        membre_2 = User.objects.create_user(
            username="membre2",
            email="membre2@example.test",
            password="normal-member-password",
        )
        participation_2 = MembreSeance.objects.create(
            seance=self.seance,
            utilisateur=membre_2,
            nom_prenom="Membre Deux",
        )

        with self.captureOnCommitCallbacks(execute=True):
            sent_count = notify_members_validation_requested(self.seance)
            notify_president_validation_requested(self.seance)

        self.assertEqual(sent_count, 2)
        self.assertEqual(len(mail.outbox), 3)

        passwords = []
        for message in mail.outbox:
            password_line = next(
                line for line in message.body.splitlines()
                if line.startswith("Mot de passe de validation :")
            )
            passwords.append(password_line.split(":", 1)[1].strip())

        self.assertEqual(len(set(passwords)), 3)
        self.assertIn("-M", passwords[0])
        self.assertIn("-P", passwords[-1])

        self.participation.refresh_from_db()
        participation_2.refresh_from_db()
        self.seance.refresh_from_db()

        self.assertTrue(
            check_password(passwords[0], self.participation.validation_password_hash)
        )
        self.assertTrue(
            check_password(passwords[1], participation_2.validation_password_hash)
        )
        self.assertTrue(
            check_password(passwords[2], self.seance.president_validation_password_hash)
        )

    def test_member_validation_password_is_temporary_and_not_user_login(self):
        with self.captureOnCommitCallbacks(execute=True):
            notify_members_validation_requested(self.seance)

        message = mail.outbox[0]
        password_line = next(
            line for line in message.body.splitlines()
            if line.startswith("Mot de passe de validation :")
        )
        validation_password = password_line.split(":", 1)[1].strip()

        self.participation.refresh_from_db()
        self.membre.refresh_from_db()

        self.assertTrue(
            check_password(validation_password, self.participation.validation_password_hash)
        )
        self.assertFalse(self.membre.check_password(validation_password))

    def test_public_validation_accepts_copied_password_with_outer_spaces(self):
        with self.captureOnCommitCallbacks(execute=True):
            notify_members_validation_requested(self.seance)

        message = mail.outbox[0]
        password_line = next(
            line for line in message.body.splitlines()
            if line.startswith("Mot de passe de validation :")
        )
        validation_password = password_line.split(":", 1)[1].strip()

        factory = APIRequestFactory()
        request = factory.post(
            f"/api/ouverture/seances/{self.seance.id}/validation-acces/",
            {
                "role": "membre",
                "email": "membre@example.test",
                "password": f"  {validation_password}\n",
            },
            format="json",
        )
        response = seance_validation_access(request, self.seance.id)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["participant"]["email"], "membre@example.test")

    def test_member_validation_decision_consumes_temporary_password(self):
        self._assert_member_decision_consumes_temporary_password(
            "VALIDER",
            MembreSeance.Decision.VALIDEE,
        )

    def test_member_rejection_consumes_temporary_password(self):
        self._assert_member_decision_consumes_temporary_password(
            "REJETER",
            MembreSeance.Decision.REJETEE,
            commentaire="Dossier a reprendre.",
        )

    def test_member_rejection_continues_to_president_validation(self):
        with self.captureOnCommitCallbacks(execute=True):
            notify_members_validation_requested(self.seance)

        message = mail.outbox[0]
        password_line = next(
            line for line in message.body.splitlines()
            if line.startswith("Mot de passe de validation :")
        )
        validation_password = password_line.split(":", 1)[1].strip()

        factory = APIRequestFactory()
        request = factory.post(
            f"/api/ouverture/seances/{self.seance.id}/validation-decision/",
            {
                "role": "membre",
                "email": "membre@example.test",
                "password": validation_password,
                "decision": "REJETER",
                "commentaire": "Reserve du membre.",
            },
            format="json",
        )

        with self.captureOnCommitCallbacks(execute=True):
            response = seance_validation_decision(request, self.seance.id)

        self.assertEqual(response.status_code, 200)
        self.participation.refresh_from_db()
        self.seance.refresh_from_db()

        self.assertEqual(self.participation.decision, MembreSeance.Decision.REJETEE)
        self.assertEqual(self.seance.statut, SeanceOuverture.Statut.EN_VALIDATION_PRESIDENT)
        self.assertEqual(self.seance.president_decision, SeanceOuverture.Decision.EN_ATTENTE)
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[1].to, ["president@example.test"])

    def _assert_member_decision_consumes_temporary_password(
        self,
        decision,
        expected_decision,
        commentaire="",
    ):
        with self.captureOnCommitCallbacks(execute=True):
            notify_members_validation_requested(self.seance)

        message = mail.outbox[0]
        password_line = next(
            line for line in message.body.splitlines()
            if line.startswith("Mot de passe de validation :")
        )
        validation_password = password_line.split(":", 1)[1].strip()

        factory = APIRequestFactory()
        request = factory.post(
            f"/api/ouverture/seances/{self.seance.id}/validation-decision/",
            {
                "role": "membre",
                "email": "membre@example.test",
                "password": validation_password,
                "decision": decision,
                "commentaire": commentaire,
            },
            format="json",
        )
        response = seance_validation_decision(request, self.seance.id)

        self.assertEqual(response.status_code, 200)
        self.participation.refresh_from_db()
        self.assertEqual(self.participation.decision, expected_decision)
        self.assertEqual(self.participation.validation_password_hash, "")
        self.assertIsNotNone(self.participation.validation_password_consumed_at)

        request = factory.post(
            f"/api/ouverture/seances/{self.seance.id}/validation-acces/",
            {
                "role": "membre",
                "email": "membre@example.test",
                "password": validation_password,
            },
            format="json",
        )
        response = seance_validation_access(request, self.seance.id)

        self.assertEqual(response.status_code, 400)

    def test_available_users_excludes_validation_only_commission_accounts(self):
        commission_user = User(
            username="commission-temp",
            email="commission-temp@example.test",
            first_name="Commission",
            last_name="Temp",
            is_active=True,
        )
        commission_user.set_unusable_password()
        commission_user.save()

        factory = APIRequestFactory()
        request = factory.get("/api/ouverture/utilisateurs/")
        force_authenticate(request, user=self.secretaire)
        response = available_users(request)

        self.assertEqual(response.status_code, 200)
        user_ids = {item["id"] for item in response.data}
        self.assertIn(self.president.id, user_ids)
        self.assertNotIn(commission_user.id, user_ids)
