from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand


ROLE_FIXTURES = [
    {
        "username": "demo_demandeur",
        "email": "demo.demandeur@ucp.local",
        "first_name": "Demo",
        "last_name": "Demandeur",
        "groups": (),
        "label": "Demandeur",
    },
    {
        "username": "demo_hierarchique",
        "email": "demo.hierarchique@ucp.local",
        "first_name": "Demo",
        "last_name": "Hierarchique",
        "groups": ("VALIDATEUR_HIERARCHIQUE",),
        "label": "Validateur hierarchique",
    },
    {
        "username": "demo_technique",
        "email": "demo.technique@ucp.local",
        "first_name": "Demo",
        "last_name": "Technique",
        "groups": ("VALIDATEUR_TECHNIQUE",),
        "label": "Validateur technique",
    },
    {
        "username": "demo_finance",
        "email": "demo.finance@ucp.local",
        "first_name": "Demo",
        "last_name": "Finance",
        "groups": ("FINANCE",),
        "label": "Finance",
    },
    {
        "username": "demo_programme",
        "email": "demo.programme@ucp.local",
        "first_name": "Demo",
        "last_name": "Programme",
        "groups": ("VALIDATEUR_PROGRAMMATIQUE",),
        "label": "Validateur programmatique",
    },
    {
        "username": "demo_approbateur",
        "email": "demo.approbateur@ucp.local",
        "first_name": "Demo",
        "last_name": "Approbateur",
        "groups": ("APPROBATEUR_NATIONAL",),
        "label": "Approbateur national",
    },
    {
        "username": "demo_agent_achat",
        "email": "demo.achat@ucp.local",
        "first_name": "Demo",
        "last_name": "Achat",
        "groups": ("AGENT_ACHAT",),
        "label": "Agent achat",
    },
    {
        "username": "demo_agent_marche",
        "email": "demo.marche@ucp.local",
        "first_name": "Demo",
        "last_name": "Marche",
        "groups": ("AGENT_MARCHE",),
        "label": "Agent marche",
    },
    {
        "username": "demo_logistique",
        "email": "demo.logistique@ucp.local",
        "first_name": "Demo",
        "last_name": "Logistique",
        "groups": ("LOGISTIQUE",),
        "label": "Logistique",
    },
]


class Command(BaseCommand):
    help = (
        "Cree les comptes de test principaux avec leurs groupes Django "
        "pour le workflow achats."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default="secret123",
            help="Mot de passe commun a appliquer aux comptes demo.",
        )
        parser.add_argument(
            "--reset-password",
            action="store_true",
            help="Reapplique le mot de passe meme sur les comptes deja existants.",
        )

    def handle(self, *args, **options):
        password = options["password"]
        reset_password = options["reset_password"]
        user_model = get_user_model()

        created_users = 0
        updated_users = 0

        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Creation des comptes demo UCP"))

        for fixture in ROLE_FIXTURES:
            groups = [
                Group.objects.get_or_create(name=group_name)[0]
                for group_name in fixture["groups"]
            ]

            defaults = {
                "email": fixture["email"],
                "first_name": fixture["first_name"],
                "last_name": fixture["last_name"],
                "is_active": True,
            }

            user, created = user_model.objects.update_or_create(
                username=fixture["username"],
                defaults=defaults,
            )

            if created or reset_password:
                user.set_password(password)
                user.save(update_fields=["password"])

            user.groups.set(groups)

            if created:
                created_users += 1
                status_label = self.style.SUCCESS("cree")
            else:
                updated_users += 1
                status_label = self.style.WARNING("mis a jour")

            group_names = ", ".join(fixture["groups"]) or "Aucun groupe"
            self.stdout.write(
                f" - {fixture['username']} ({fixture['label']}) [{status_label}] -> {group_names}"
            )

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Termine."))
        self.stdout.write(
            f"Comptes crees: {created_users} | Comptes mis a jour: {updated_users}"
        )
        self.stdout.write(f"Mot de passe courant: {password}")
