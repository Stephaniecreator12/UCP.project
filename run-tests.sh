#!/usr/bin/env bash
# Lance la suite de tests Django sur un PostgreSQL Docker jetable
# (comportement Testcontainers) : le conteneur est cree automatiquement
# au debut des tests et supprime a la fin, donnees effacees.
# Usage : ./run-tests.sh [options django, ex: apps.users.tests]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Choisir l'interpreteur Python du venv s'il existe.
if [ -x "$ROOT_DIR/.venv/bin/python" ]; then
  PY="$ROOT_DIR/.venv/bin/python"
elif [ -x "$ROOT_DIR/.venv/Scripts/python.exe" ]; then
  PY="$ROOT_DIR/.venv/Scripts/python.exe"
else
  PY="python"
fi

cd "$ROOT_DIR/backend_PPM"
"$PY" manage.py test --settings=config.test_settings "$@"