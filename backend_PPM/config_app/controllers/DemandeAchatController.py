from rest_framework.decorators import api_view
from rest_framework.response import Response
from ..services.DemandeAchatService import creer_demande
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes


#@permission_classes([IsAuthenticated])
@api_view(['POST'])
def creer_demande(request):

    service = request.data.get("service")
    demandeur = request.data.get("demandeur")
    fonction = request.data.get("fonction")

    demande = creer_demande(service, demandeur, fonction)

    return Response({
        "message": "Demande créée",
        "id": demande.id
    })