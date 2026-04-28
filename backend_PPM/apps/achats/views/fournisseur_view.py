from rest_framework import viewsets, permissions
from ..models.fournisseur import Fournisseur
from ..serializers.fournisseur_serializer import FournisseurSerializer

class FournisseurViewSet(viewsets.ModelViewSet):
    queryset = Fournisseur.objects.filter(actif=True)
    serializer_class = FournisseurSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["nom", "email"]
    ordering_fields = ["nom", "created_at"]
