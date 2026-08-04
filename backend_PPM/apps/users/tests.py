"""Integration tests for the users & auth API endpoints."""

from unittest.mock import patch

from django.core.signing import TimestampSigner

from apps.users.models import UserProfile
from testsupport import DIALOGUE_PASSWORD, UCPAPITestCase


class TestMeEndpoint(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = self.create_user("me@test.local")

    def test_me_requires_authentication(self):
        response = self.unauth_client().get("/api/users/me/")
        self.assertEqual(response.status_code, 401)

    def test_me_returns_profile_with_groups_and_role(self):
        self.create_group("FINANCE")
        self.user.groups.add(self.create_group("DEMANDEUR"))
        client = self.auth_client(self.user)

        response = client.get("/api/users/me/")

        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["email"], "me@test.local")
        self.assertIn("DEMANDEUR", data["groups"])
        self.assertIn("role", data)

    def test_me_with_bearer_token_from_login(self):
        client = self.login_client("me@test.local")

        response = client.get("/api/users/me/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["email"], "me@test.local")


class TestUserListCreate(UCPAPITestCase):
    def test_create_user_requires_valid_email_and_password(self):
        response = self.unauth_client().post(
            "/api/users/create/",
            {"email": "not-an-email", "password": "x"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_create_user_adds_demandeur_group(self):
        response = self.unauth_client().post(
            "/api/users/create/",
            {"email": "newuser@test.local", "password": DIALOGUE_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["email"], "newuser@test.local")
        self.assertIn("DEMANDEUR", response.json()["groups"])
        self.assertTrue(
            UserProfile.objects.get(email="newuser@test.local").groups.filter(
                name="DEMANDEUR"
            ).exists()
        )

    def test_create_user_duplicate_email_returns_400(self):
        self.create_user("dup@test.local")
        response = self.unauth_client().post(
            "/api/users/create/",
            {"email": "dup@test.local", "password": DIALOGUE_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())

    def test_list_users_requires_staff(self):
        plain = self.create_user("plain@test.local")
        staff = self.create_user("staff@test.local", is_staff=True)

        self.auth_client(staff)
        forbidden = self.auth_client(plain)
        admin = self.auth_client(staff)

        self.assertEqual(forbidden.get("/api/users/list/").status_code, 403)
        response = admin.get("/api/users/list/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            any(item["email"] == "plain@test.local" for item in response.json())
        )


class TestLoginFlow(UCPAPITestCase):
    def test_login_success_returns_tokens(self):
        self.create_user("login@test.local")
        response = self.unauth_client().post(
            "/api/users/login/",
            {"email": "login@test.local", "password": DIALOGUE_PASSWORD},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("access", payload)
        self.assertIn("refresh", payload)
        self.assertEqual(payload["user"]["email"], "login@test.local")

    def test_login_auto_assigns_demandeur_group(self):
        self.create_user("groupless@test.local")
        client = self.unauth_client()
        client.post(
            "/api/users/login/",
            {"email": "groupless@test.local", "password": DIALOGUE_PASSWORD},
            format="json",
        )
        user = UserProfile.objects.get(email="groupless@test.local")
        self.assertTrue(user.groups.filter(name="DEMANDEUR").exists())

    def test_login_unknown_email(self):
        response = self.unauth_client().post(
            "/api/users/login/",
            {"email": "ghost@test.local", "password": DIALOGUE_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())

    def test_login_wrong_password(self):
        self.create_user("wrongpw@test.local", password="RealSecret99!")
        response = self.unauth_client().post(
            "/api/users/login/",
            {"email": "wrongpw@test.local", "password": "WrongSecret99!"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.json())

    def test_login_inactive_user(self):
        self.create_user("inactive@test.local", is_active=False, groups=("PUBLIC",))
        response = self.unauth_client().post(
            "/api/users/login/",
            {"email": "inactive@test.local", "password": DIALOGUE_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())

    def test_token_refresh(self):
        self.create_user("refresh@test.local")
        login = self.unauth_client().post(
            "/api/users/login/",
            {"email": "refresh@test.local", "password": DIALOGUE_PASSWORD},
            format="json",
        )
        response = self.unauth_client().post(
            "/api/token/refresh/",
            {"refresh": login.json()["refresh"]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())

    def test_token_refresh_rejects_garbage(self):
        response = self.unauth_client().post(
            "/api/token/refresh/",
            {"refresh": "not-a-token"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)


class TestPublicRegistrationAndVerification(UCPAPITestCase):
    def _register(self, email="public@test.local", full_name="Public User One"):
        return self.unauth_client().post(
            "/api/users/public/create/",
            {
                "email": email,
                "password": DIALOGUE_PASSWORD,
                "full_name": full_name,
                "type_entite": "ONG",
                "phone": "+261 34 123 45",
            },
            format="json",
        )

    @patch("apps.users.tasks.envoyer_confirmation_email_task.envoyer_confirmation_email.delay")
    def test_public_registration_creates_inactive_public_user(self, mock_delay):
        response = self._register()

        self.assertEqual(response.status_code, 201)
        user = UserProfile.objects.get(email="public@test.local")
        self.assertFalse(user.is_active)
        self.assertTrue(user.groups.filter(name="PUBLIC").exists())
        self.assertEqual(user.type_entite, "ONG")
        mock_delay.assert_called_once_with("public@test.local", "Public User One")

    def test_public_registration_duplicate_email(self):
        self.create_user("public@test.local")
        response = self._register()
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())

    @patch("apps.users.tasks.envoyer_confirmation_email_task.envoyer_confirmation_email.delay")
    def test_verify_email_with_valid_token_activates_account(self, mock_delay):
        self._register()
        token = TimestampSigner().sign("public@test.local")

        response = self.unauth_client().post(
            "/api/auth/verify-email/", {"token": token}, format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            UserProfile.objects.get(email="public@test.local").is_active
        )

    def test_verify_email_with_invalid_token(self):
        response = self.unauth_client().post(
            "/api/auth/verify-email/", {"token": "garbage"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_resend_email_when_missing(self):
        response = self.unauth_client().post(
            "/api/auth/resend-email/", {}, format="json"
        )
        self.assertEqual(response.status_code, 400)


class TestFindUserByEmail(UCPAPITestCase):
    def test_find_by_email_success(self):
        self.create_user("finder@test.local")
        response = self.client.get("/api/users/by-email/", {"email": "finder@test.local"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["email"], "finder@test.local")

    def test_find_by_email_missing_param(self):
        response = self.client.get("/api/users/by-email/")
        self.assertEqual(response.status_code, 400)

    def test_find_by_email_not_found(self):
        response = self.client.get("/api/users/by-email/", {"email": "nobody@test.local"})
        self.assertEqual(response.status_code, 404)


class TestGroupsEndpoint(UCPAPITestCase):
    def test_list_groups_requires_auth(self):
        self.assertEqual(self.unauth_client().get("/api/users/groups/").status_code, 401)

    def test_list_groups_returns_created_groups(self):
        self.create_group("FINANCE")
        self.create_group("DEMANDEUR")
        client = self.auth_client(self.create_user("groups@test.local"))

        response = client.get("/api/users/groups/")

        self.assertEqual(response.status_code, 200)
        names = {item["name"] for item in response.json()}
        self.assertIn("FINANCE", names)
        self.assertIn("DEMANDEUR", names)


class TestSyncRHUser(UCPAPITestCase):
    def test_sync_requires_email_and_password(self):
        response = self.client.post("/api/users/sync/", {"email": "x@y.z"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_sync_creates_user_with_password_and_demandeur_group(self):
        response = self.client.post(
            "/api/users/sync/",
            {"email": "rh@test.local", "password": DIALOGUE_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        user = UserProfile.objects.get(email="rh@test.local")
        self.assertTrue(user.check_password(DIALOGUE_PASSWORD))
        self.assertTrue(user.groups.filter(name="DEMANDEUR").exists())

    def test_sync_updates_existing_user_password(self):
        user = self.create_user("rh2@test.local", password="OldPassword123!")
        response = self.client.post(
            "/api/users/sync/",
            {"email": "rh2@test.local", "password": DIALOGUE_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password(DIALOGUE_PASSWORD))