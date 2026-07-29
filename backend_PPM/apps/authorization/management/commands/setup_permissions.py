from django.core.management.base import BaseCommand, CommandError
from apps.authorization.setup import setup_all_groups, list_missing_content_types
from apps.authorization.config import GROUP_DEFINITIONS, CATEGORIES


class Command(BaseCommand):
    help = "Crée ou met à jour tous les groupes et leurs permissions"

    def add_arguments(self, parser):
        parser.add_argument(
            "--check",
            action="store_true",
            help="Vérifie uniquement les ContentTypes manquants sans créer les groupes",
        )
        parser.add_argument(
            "--list",
            action="store_true",
            help="Affiche la liste des groupes qui seront créés",
        )

    def handle(self, *args, **options):
        if options["list"]:
            self._list_groups()
            return

        if options["check"]:
            self._check_content_types()
            return

        self._run_setup()

    def _list_groups(self):
        self.stdout.write(self.style.SUCCESS("=== Groupes configurés ==="))
        categories_used = set()
        for g in GROUP_DEFINITIONS:
            categories_used.add(g["category"])
            self.stdout.write(f"  [{g['category']}] {g['name']}")
            self.stdout.write(f"       {g['description']}")
            perms = g.get("permissions", {})
            for app_label, models in perms.items():
                for model_name, actions in models.items():
                    self.stdout.write(
                        f"       • {app_label}.{model_name}: {', '.join(actions)}"
                    )
            self.stdout.write("")

        self.stdout.write(self.style.SUCCESS(f"\nCatégories ({len(categories_used)}):"))
        for key, label in CATEGORIES.items():
            if key in categories_used:
                count = sum(1 for g in GROUP_DEFINITIONS if g["category"] == key)
                self.stdout.write(f"  {key} ({label}) — {count} groupe(s)")

        self.stdout.write(self.style.SUCCESS(f"\nTotal: {len(GROUP_DEFINITIONS)} groupes"))

    def _check_content_types(self):
        missing = list_missing_content_types()
        if missing:
            self.stdout.write(
                self.style.WARNING(
                    "ContentTypes manquants — exécutez 'python manage.py migrate' d'abord :"
                )
            )
            for item in missing:
                self.stdout.write(f"  • {item}")
            raise CommandError(
                f"{len(missing)} ContentType(s) manquant(s). Lancez 'python manage.py migrate'."
            )
        self.stdout.write(self.style.SUCCESS("Tous les ContentTypes sont présents."))

    def _run_setup(self):
        self.stdout.write(self.style.SUCCESS("=== Configuration des groupes et permissions ==="))

        missing = list_missing_content_types()
        if missing:
            self.stdout.write(
                self.style.WARNING(
                    "ContentTypes manquants — exécutez d'abord 'python manage.py migrate' :"
                )
            )
            for item in missing:
                self.stdout.write(f"  • {item}")
            return

        results = setup_all_groups()
        total = results["updated"] + results["created"]

        self.stdout.write(self.style.SUCCESS(f"\n✓ {total} groupes configurés avec succès"))
        if results["errors"]:
            self.stdout.write(self.style.ERROR(f"✗ {results['errors']} erreur(s)"))
