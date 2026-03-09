from rest_framework import viewsets
from .models import DemandeAchat
from .serializers import DemandeAchatSerializer

class DemandeAchatViewSet(viewsets.ModelViewSet):
    """
    Cette 'Vue' s'occupe de fournir toutes les actions classiques (CRUD)
    pour le modèle DemandeAchat.
    """
    # 1. On lui donne toutes les données de la table "DemandeAchat"
    queryset = DemandeAchat.objects.all()
    
    # 2. On lui dit d'utiliser notre Sérialiseur pour traduire ces données en JSON
    serializer_class = DemandeAchatSerializer
