"""
Parametres de test UCP.

Les tests tournent sur un PostgreSQL Docker **jetable** via la librairie
officielle ``testcontainers-python`` (``config.testcontainers_runner``) : le
conteneur demarre automatiquement au debut de la suite, puis est arrete /
supprime a la fin. Toutes les donnees sont effacees a chaque execution et la
base de developpement/production n'est jamais contactee.

Lancement (aucune etape manuelle) :
    python backend_PPM/manage.py test --settings=config.test_settings
    # ou simplement :  scripts/tests/run-tests.sh
    # Windows :        scripts/tests/run-tests.ps1
"""

from .settings import *  # noqa: F401,F403

# Runner qui demarre/supprime automatiquement le PostgreSQL Docker jetable
# avec testcontainers-python.
TEST_RUNNER = "config.testcontainers_runner.PostgresTestRunner"

# Hasher rapide pour accelerer les tests (ne jamais utiliser en prod).
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Jamais d'emails reels pendant les tests.
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
DEFAULT_FROM_EMAIL = "tests@ucp.local"
ACHATS_NOTIFICATION_EMAILS_ENABLED = True
