import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.achats.services.demande_service import list_mes_demandes
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()
if user:
    try:
        qs = list_mes_demandes(user)
        list(qs[:5])  # Evaluate query
        print("SUCCESS")
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print("NO USER FOUND")
