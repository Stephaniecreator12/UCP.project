import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.achats.models.fournisseur import Fournisseur

suppliers = [
    {"nom": "OFFICE PLUS SARL", "email": "contact@officeplus.mg", "telephone": "034 11 222 33", "adresse": "Antananarivo"},
    {"nom": "MADATECH", "email": "sales@madatech.mg", "telephone": "032 55 666 77", "adresse": "Tamatave"},
    {"nom": "LOGISTIC PRO", "email": "info@logisticpro.mg", "telephone": "033 88 999 00", "adresse": "Majunga"},
]

for s in suppliers:
    Fournisseur.objects.get_or_create(nom=s["nom"], defaults=s)

print("Suppliers seeded successfully.")
