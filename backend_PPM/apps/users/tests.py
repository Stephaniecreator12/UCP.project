from io import StringIO

from django.contrib.auth.models import Group
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import override_settings
from rest_framework.test import APIClient
from unittest.mock import patch

User = get_user_model()


class TestMeEndpoint(TestCase):

    def setUp(self):

        self.user = User.objects.create_user(
            username="bob",
            password="pwd123"
        )

        self.client = APIClient()

        self.client.force_authenticate(self.user)


    def test_me(self):

        r = self.client.get("/api/users/me/")

        self.assertEqual(r.status_code, 200)

        self.assertEqual(r.json()["username"], "bob")

    @override_settings(
        EXTERNAL_PERSONNEL_API_URL="https://ami.example.com/api/personnel",
        EXTERNAL_PERSONNEL_API_TOKEN="secret-token",
    )
    @patch("apps.users.services.external_personnel.request.urlopen")
    def test_external_personnel_proxy_returns_normalized_list(self, mock_urlopen):

        class FakeHeaders:
            @staticmethod
            def get_content_charset():
                return "utf-8"

        class FakeResponse:
            headers = FakeHeaders()

            def read(self):
                return (
                    b'{"results": [{"id": 4, "nom": "Rakoto", "prenom": "Jean", '
                    b'"service": "Finance"}]}'
                )

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        mock_urlopen.return_value = FakeResponse()

        response = self.client.get("/api/users/external-personnel/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": "4",
                    "label": "Rakoto Jean",
                    "subtitle": "Finance",
                }
            ],
        )

        request_obj = mock_urlopen.call_args.args[0]
        self.assertEqual(request_obj.full_url, "https://ami.example.com/api/personnel")
        self.assertEqual(request_obj.headers.get("Authorization"), "Bearer secret-token")

    @override_settings(
        EXTERNAL_PERSONNEL_API_URL="http://ami.example.com/api/fullpersonnelles",
    )
    @patch("apps.users.services.external_personnel.request.urlopen")
    def test_external_personnel_proxy_supports_service_actuel_payload(self, mock_urlopen):

        class FakeHeaders:
            @staticmethod
            def get_content_charset():
                return "utf-8"

        class FakeResponse:
            headers = FakeHeaders()

            def read(self):
                return (
                    b'[{"id": 10, "nom": "Rakotomavo", "prenom": "Oriah", '
                    b'"service_actuel": "Informatique / IT"}]'
                )

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        mock_urlopen.return_value = FakeResponse()

        response = self.client.get("/api/users/external-personnel/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": "10",
                    "label": "Rakotomavo Oriah",
                    "subtitle": "Informatique / IT",
                }
            ],
        )

    @override_settings(EXTERNAL_PERSONNEL_API_URL="")
    def test_external_personnel_proxy_requires_configuration(self):

        response = self.client.get("/api/users/external-personnel/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"], "EXTERNAL_PERSONNEL_API_URL manquante.")


class SeedRoleUsersCommandTests(TestCase):
    def test_command_creates_expected_demo_users_and_groups(self):
        stdout = StringIO()

        call_command("seed_role_users", password="secret123", stdout=stdout)

        self.assertTrue(User.objects.filter(username="demo_demandeur").exists())
        finance_user = User.objects.get(username="demo_finance")
        agent_user = User.objects.get(username="demo_agent_achat")

        self.assertTrue(finance_user.groups.filter(name="FINANCE").exists())
        self.assertTrue(agent_user.groups.filter(name="AGENT_ACHAT").exists())
        self.assertTrue(Group.objects.filter(name="VALIDATEUR_HIERARCHIQUE").exists())
