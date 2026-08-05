"""
Runner de tests Django au comportement "Testcontainers".

Avant l'execution des tests, un conteneur PostgreSQL jetable est demarre
automatiquement via le CLI Docker. A la fin (succes, erreur ou Ctrl-C),
le conteneur est arrete puis supprime : toutes les donnees sont effacees.

Aucune intervention manuelle n'est necessaire et la vraie base de
developpement/production n'est jamais contactee.

Mettre ``DB_TEST_USE_EXTERNAL=1`` pour desactiver le conteneur jetable et
utiliser la base de test externe configuree dans ``config.test_settings``
(ex. le service ``db`` de docker-compose, ou une base de CI).
"""

import os
import socket
import subprocess
import sys
import time
import uuid

from django.conf import settings
from django.test.runner import DiscoverRunner

DOCKER_IMAGE = os.getenv("DB_TEST_DOCKER_IMAGE", "postgres:16-alpine")
READINESS_TIMEOUT = 90  # secondes


class EphemeralPostgresRunner(DiscoverRunner):
    """Lance chaque suite de tests sur un PostgreSQL Docker jetable."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._container_name = None
        self._container_id = None
        self._port = None

    # ------------------------------------------------------------------ #
    # Cycle de vie du conteneur
    # ------------------------------------------------------------------ #

    def _print(self, message):
        if self.verbosity >= 1:
            print(message, flush=True)

    @staticmethod
    def _free_port():
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            return sock.getsockname()[1]

    def _run(self, args):
        return subprocess.run(args, capture_output=True, text=True)

    def _remove_stale_containers(self):
        """Supprime les conteneurs de test orphelins d'anciennes executions."""
        result = self._run(
            ["docker", "ps", "-aq", "--filter", "label=ucp-test-pg"]
        )
        for container_id in result.stdout.split():
            self._run(["docker", "rm", "-f", container_id])

    def _start_container(self):
        if not self._uses_ephemeral:
            return

        try:
            self._run(["docker", "version"])
        except FileNotFoundError:
            sys.exit(
                "Docker n'est pas installe ou absent du PATH. "
                "Installez Docker Desktop (ou activez la base de test "
                "externe avec DB_TEST_USE_EXTERNAL=1)."
            )

        self._remove_stale_containers()

        self._port = self._free_port()
        self._container_name = (
            f"ucp-test-pg-{os.getpid()}-{uuid.uuid4().hex[:8]}"
        )
        self._print(
            f"Démarrage du PostgreSQL Docker jetable "
            f"({self._container_name}, port {self._port})..."
        )

        result = self._run(
            [
                "docker", "run", "-d", "--rm",
                "--name", self._container_name,
                "--label", "ucp-test-pg",
                "-e", "POSTGRES_USER=postgres",
                "-e", "POSTGRES_PASSWORD=passation",
                "-p", f"127.0.0.1:{self._port}:5432",
                DOCKER_IMAGE,
            ]
        )
        if result.returncode != 0:
            sys.exit(
                f"Echec du demarrage du conteneur PostgreSQL : {result.stderr}"
            )
        self._container_id = result.stdout.strip()

        for _ in range(READINESS_TIMEOUT):
            ready = self._run(
                [
                    "docker", "exec", self._container_name,
                    "pg_isready", "-U", "postgres", "-d", "postgres",
                ]
            )
            if ready.returncode == 0:
                break
            time.sleep(1)
        else:
            self._stop_container()
            sys.exit("Le PostgreSQL jetable n'est pas devenu pret a temps.")

        # Met a jour le dict existant (et non plus le remplace) pour
        # conserver les cles injectees par Django (ATOMIC_REQUESTS,
        # AUTOCOMMIT, OPTIONS, TEST.MIRROR, ...).
        db_settings = settings.DATABASES["default"]
        db_settings.update(
            {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": "test_passation_db",
                "USER": "postgres",
                "PASSWORD": "passation",
                "HOST": "127.0.0.1",
                "PORT": str(self._port),
            }
        )
        db_settings.setdefault("TEST", {})["NAME"] = "test_passation_db"
        self._print(f"PostgreSQL jetable pret sur 127.0.0.1:{self._port}")

    def _stop_container(self):
        if not self._container_id:
            return
        self._print(
            "Arret et suppression du conteneur jetable (donnees effacees)..."
        )
        self._run(["docker", "rm", "-f", self._container_id])
        self._container_id = None
        self._container_name = None
        self._port = None

    @property
    def _uses_ephemeral(self):
        return os.getenv("DB_TEST_USE_EXTERNAL") != "1"

    # ------------------------------------------------------------------ #
    # Integration avec le runner Django
    # ------------------------------------------------------------------ #

    def setup_databases(self, **kwargs):
        self._start_container()
        return super().setup_databases(**kwargs)

    def teardown_databases(self, old_config, **kwargs):
        try:
            super().teardown_databases(old_config, **kwargs)
        finally:
            self._stop_container()

    def run_tests(self, test_labels, extra_tests=None, **kwargs):
        # Le conteneur jetable est unique : inutile (et dangereux) de
        # creer des bases paralleles.
        self.parallel = 0
        try:
            return super().run_tests(
                test_labels, extra_tests=extra_tests, **kwargs
            )
        except BaseException:
            self._stop_container()
            raise
