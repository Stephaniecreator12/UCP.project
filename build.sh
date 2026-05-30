#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

if [ "${SEED_DEMO_USERS:-False}" = "True" ]; then
  python manage.py seed_role_users --password "${DEMO_USERS_PASSWORD:-test12345}" --reset-password
fi
