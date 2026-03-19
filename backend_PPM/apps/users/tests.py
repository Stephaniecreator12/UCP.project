from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

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