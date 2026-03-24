#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Cela force Python à regarder dans le dossier actuel pour trouver 'marches'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    # On force Python à regarder ICI
    current_path = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_path)
    
    # On utilise le nouveau nom du dossier
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError("Django n'est pas installé dans le venv !") from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
