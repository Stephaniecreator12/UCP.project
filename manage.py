#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Cela force Python à regarder dans le dossier backend_PPM pour trouver 'config_app'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend_PPM")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

def main():
    # On utilise la config Django unique dans backend_PPM/config_app
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config_app.settings')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError("Django n'est pas installé dans le venv !") from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
