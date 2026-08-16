import re

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand


DEFAULT_VALIDATORS = {
    "RPM": {
        "email": "raknaliarisoa@gmail.com",
        "first_name": "Test",
        "last_name": "RPM",
        "label": "Responsable passation de marché",
    },
    "GP": {
        "email": "razafimahaleomami@gmail.com",
        "first_name": "Test",
        "last_name": "GP",
        "label": "Gestionnaire Programme",
    },
    "CN": {
        "email": "stephanie.maminiaina23@gmail.com",
        "first_name": "Test",
        "last_name": "CN",
        "label": "Coordonnateur National",
    },
}


def username_from_email(email: str) -> str:
    username = re.sub(r"[^a-zA-Z0-9_@.+-]", "", email.split("@", 1)[0]).strip()
    return username or "validateur_composition"


class Command(BaseCommand):
    help = "Cree les groupes RPM/GP/CN et les comptes de test pour valider la composition des membres."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default="secret123",
            help="Mot de passe commun des comptes de test.",
        )
        parser.add_argument(
            "--reset-password",
            action="store_true",
            help="Reapplique le mot de passe sur les comptes deja existants.",
        )
        parser.add_argument("--rpm-email", default=DEFAULT_VALIDATORS["RPM"]["email"])
        parser.add_argument("--gp-email", default=DEFAULT_VALIDATORS["GP"]["email"])
        parser.add_argument("--cn-email", default=DEFAULT_VALIDATORS["CN"]["email"])

    def handle(self, *args, **options):
        user_model = get_user_model()
        password = options["password"]
        reset_password = options["reset_password"]
        email_overrides = {
            "RPM": options["rpm_email"].strip().lower(),
            "GP": options["gp_email"].strip().lower(),
            "CN": options["cn_email"].strip().lower(),
        }

        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Creation validateurs composition"))

        for role, fixture in DEFAULT_VALIDATORS.items():
            email = email_overrides[role]
            group, _ = Group.objects.get_or_create(name=role)
            user = user_model.objects.filter(email__iexact=email).order_by("id").first()
            created = False

            if user is None:
                username_base = username_from_email(email)
                username = username_base
                counter = 1
                while user_model.objects.filter(username=username).exists():
                    counter += 1
                    username = f"{username_base}{counter}"
                user = user_model.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=fixture["first_name"],
                    last_name=fixture["last_name"],
                    is_active=True,
                )
                created = True
            else:
                user.is_active = True
                if not user.first_name:
                    user.first_name = fixture["first_name"]
                if not user.last_name:
                    user.last_name = fixture["last_name"]
                if reset_password:
                    user.set_password(password)
                user.save()

            user.groups.add(group)
            status_label = self.style.SUCCESS("cree") if created else self.style.WARNING("mis a jour")
            self.stdout.write(
                f" - {role} ({fixture['label']}) [{status_label}] -> {email}"
            )

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Termine."))
        self.stdout.write(f"Mot de passe courant: {password}")
