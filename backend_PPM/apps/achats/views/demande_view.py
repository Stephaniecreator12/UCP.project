from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.achats.models import DemandeAchat
from apps.achats.serializers import DemandeAchatSerializer
from apps.achats.services import create_demande, list_mes_demandes ,submit_demande


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def demande_list_create_view(request):
    if request.method == "GET":
        demandes = list_mes_demandes(request.user)
        serializer = DemandeAchatSerializer(demandes, many=True)
        return Response(serializer.data)

    serializer = DemandeAchatSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = create_demande(serializer.validated_data, request.user)

    return Response(
        DemandeAchatSerializer(demande).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def demande_detail_view(request, demande_id):
    demande = get_object_or_404(
        DemandeAchat,
        id=demande_id,
        demandeur=request.user,
    )
    serializer = DemandeAchatSerializer(demande)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_submit_view(request, demande_id):
    demande = get_object_or_404(
        DemandeAchat,
        id=demande_id,
    )

    demande = submit_demande(demande, request.user)
    serializer = DemandeAchatSerializer(demande)
    return Response(serializer.data)
