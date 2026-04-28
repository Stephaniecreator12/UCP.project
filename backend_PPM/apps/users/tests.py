from django.test import TestCase
from django.contrib.auth import get_user_model
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

    def test_external_personnel_proxy_requires_configuration(self):

        response = self.client.get("/api/users/external-personnel/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"], "EXTERNAL_PERSONNEL_API_URL manquante.")
