"""
Paramètres de test UCP.

Les tests tournent sur un PostgreSQL Docker **jetable** (comportement
type Spring Testcontainers) : conteneur démarre automatiquement au début
de la suite, supprimé à la fin. Toutes les données sont effacées à chaque
exécution et la base de développement/production n'est jamais contactée.

Lancement (aucune étape manuelle) :
    python backend_PPM/manage.py test --settings=config.test_settings
    # ou simplement :  ./run-tests.sh   (Windows : .\run-tests.ps1)

Variantes :
    DB_TEST_USE_EXTERNAL=1  -> ne pas créer de conteneur jetable ; utiliser
    la base de test configurée ci-dessous (ex. service ``db`` de
    docker-compose ou base de CI).
    Les variables ``DB_TEST_*`` ci-dessous ne sont donc utilisées qu'avec
    ``DB_TEST_USE_EXTERNAL=1``.
"""

import os

from .settings import *  # noqa: F401,F403


def _env(name, default):
    return os.getenv(name, default)


DATABASES = {
    "default": {
        "ENGINE": _env(
            "DB_TEST_ENGINE", "django.db.backends.postgresql"
        ),
        "NAME": _env("DB_TEST_NAME", "test_passation_db"),
        "USER": _env("DB_TEST_USER", "postgres"),
        "PASSWORD": _env("DB_TEST_PASSWORD", "passation"),
        "HOST": _env("DB_TEST_HOST", "localhost"),
        "PORT": _env("DB_TEST_PORT", "55432"),
        "TEST": {
            "NAME": _env("DB_TEST_NAME", "test_passation_db"),
        },
    }
}

# Runner qui démarre/supprime automatiquement le PostgreSQL Docker jetable.
TEST_RUNNER = "config.testcontainers_runner.EphemeralPostgresRunner"

# Hasher rapide pour accélérer les tests (ne jamais utiliser en prod).
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Jamais d'emails réels pendant les tests.
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
DEFAULT_FROM_EMAIL = "tests@ucp.local"
ACHATS_NOTIFICATION_EMAILS_ENABLED = True
