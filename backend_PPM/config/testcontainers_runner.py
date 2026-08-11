"""
Runner de tests Django utilisant la librairie officielle testcontainers-python.

Un conteneur PostgreSQL jetable est demarre automatiquement au debut de la
suite de tests, puis arrete et supprime a la fin (succes, erreur ou Ctrl-C).
Toutes les donnees sont effacees a chaque execution et la base de
developpement/production n'est jamais contactee.

Utilisation (aucune etape manuelle) :
    python backend_PPM/manage.py test --settings=config.test_settings
    # ou : scripts/tests/run-tests.sh   (Windows : scripts/tests/run-tests.ps1)
"""

from django.conf import settings
from django.test.runner import DiscoverRunner
from testcontainers.community.postgres import PostgresContainer


class PostgresTestRunner(DiscoverRunner):
    """Lance chaque suite de tests sur un PostgreSQL Docker jetable
    via la librairie officielle ``testcontainers-python``."""

    DOCKER_IMAGE = "postgres:16-alpine"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._postgres: PostgresContainer | None = None

    def setup_databases(self, **kwargs):
        self._postgres = PostgresContainer(self.DOCKER_IMAGE)
        self._postgres.start()

        db_settings = settings.DATABASES["default"]
        db_settings.update(
            {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": self._postgres.dbname,
                "USER": self._postgres.username,
                "PASSWORD": self._postgres.password,
                "HOST": self._postgres.get_container_host_ip(),
                "PORT": str(self._postgres.get_exposed_port(self._postgres.port)),
            }
        )
        # Le nom de la base de test creee par Django (`test_<dbname>`).
        db_settings.setdefault("TEST", {})["NAME"] = f"test_{self._postgres.dbname}"
        return super().setup_databases(**kwargs)

    def teardown_databases(self, old_config, **kwargs):
        try:
            super().teardown_databases(old_config, **kwargs)
        finally:
            self._stop_postgres()

    def run_tests(self, test_labels, extra_tests=None, **kwargs):
        # Le conteneur jetable est unique : inutile (et dangereux) de creer
        # des bases paralleles.
        self.parallel = 0
        try:
            return super().run_tests(test_labels, extra_tests=extra_tests, **kwargs)
        except BaseException:
            self._stop_postgres()
            raise

    def _stop_postgres(self):
        if self._postgres is not None:
            self._postgres.stop()
            self._postgres = None
