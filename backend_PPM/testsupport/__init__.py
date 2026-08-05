"""Shared helpers for the UCP backend integration test suite.

The tests in this package drive the real Django URL configuration through
``APIClient`` against the test database, covering the API end to end.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core import mail
from django.test import TestCase, override_settings

from rest_framework.test import APIClient

User = get_user_model()

DIALOGUE_PASSWORD = "Secret12345!"


class EmailTestMixin:
    """Mixin that redirects outgoing emails and celery tasks to in-memory modes."""

    @classmethod
    def setUpClass(cls):
        cls._email_override = override_settings(
            EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
            DEFAULT_FROM_EMAIL="tests@ucp.local",
            CELERY_TASK_ALWAYS_EAGER=True,
            CELERY_TASK_EAGER_PROPAGATES=True,
            CELERY_BROKER_URL="memory://",
        )
        cls._email_override.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._email_override.disable()


class UCPAPITestCase(EmailTestMixin, TestCase):
    """Base class for UCP API integration tests."""

    def setUp(self):
        super().setUp()
        mail.outbox = []
        self.sequence = 0

    def create_group(self, name):
        return Group.objects.get_or_create(name=name)[0]

    def create_user(self, email, password=DIALOGUE_PASSWORD, groups=None,
                    full_name=None, is_staff=False, is_superuser=False,
                    is_active=True):
        """Create an email-based UserProfile with optional groups."""
        self.sequence += 1
        full_name = full_name or f"User {self.sequence}"
        user = User.objects.create_user(
            email=email,
            password=password,
            full_name=full_name,
            is_active=is_active,
            is_staff=is_staff,
            is_superuser=is_superuser,
        )
        for group_name in groups or []:
            group = self.create_group(group_name)
            user.groups.add(group)
        return user

    def create_staff_superuser(self, email):
        return self.create_user(email, is_staff=True, is_superuser=True)

    def auth_client(self, user=None):
        """APIClient authenticated for the given user (or a fresh user)."""
        user = user or self.create_user(f"auto{self.sequence}@test.local")
        client = APIClient()
        client.force_authenticate(user)
        client.user = user
        return client

    def unauth_client(self):
        return APIClient()

    def login_client(self, email, password=DIALOGUE_PASSWORD):
        """APIClient authenticated through the real /api/users/login/ endpoint."""
        client = APIClient()
        response = client.post(
            "/api/users/login/",
            {"email": email, "password": password},
            format="json",
        )
        client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.json()['access']}"
        )
        return client

    def grant_model_permissions(self, group, app_label, model, actions=("view",)):
        """Attach Django ``codename`` permissions to a group.

        ``codename`` = ``<action>_<model>`` e.g. view_procurementmarket.
        Missing ContentType rows are posted into the DB so grants always succeed.
        """
        from django.contrib.contenttypes.models import ContentType

        content_type, _ = ContentType.objects.get_or_create(
            app_label=app_label,
            model=model,
            defaults={"app_label": app_label, "model": model},
        )
        for action in actions:
            permission, _ = Permission.objects.get_or_create(
                content_type=content_type,
                codename=f"{action}_{model}",
                defaults={
                    "name": f"Can {action} {model}",
                    "content_type": content_type,
                },
            )
            group.permissions.add(permission)

    def call(self, method, url, user=None, **kwargs):
        """Convenience wrapper around an authenticated API call."""
        client = self.auth_client(user) if user else self.unauth_client()
        return getattr(client, method)(url, **kwargs)