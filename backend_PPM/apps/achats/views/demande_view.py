from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.achats.serializers.demande_serializer import DemandeAchatSerializer
from apps.achats.models.demande_achat import DemandeAchat


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_demande(request):

    serializer = DemandeAchatSerializer(data=request.data)

    serializer.is_valid(raise_exception=True)

    demande = serializer.save()

    return Response({"id": demande.id})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_demandes_view(request):

    demandes = DemandeAchat.objects.all()

    serializer = DemandeAchatSerializer(demandes, many=True)

    return Response({"demandes": serializer.data})