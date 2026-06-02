#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

if [ "${SEED_DEMO_USERS:-False}" = "True" ]; then
  python manage.py seed_role_users --password "${DEMO_USERS_PASSWORD:-test12345}" --reset-password
fi

# Créer automatiquement un superutilisateur administrateur s'il n'existe pas
python manage.py shell -c "import os; from django.contrib.auth import get_user_model; User = get_user_model(); username=os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin'); password=os.getenv('DJANGO_SUPERUSER_PASSWORD', 'admin12345'); email=os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@example.com'); User.objects.filter(username=username).exists() or User.objects.create_superuser(username, email, password)"

