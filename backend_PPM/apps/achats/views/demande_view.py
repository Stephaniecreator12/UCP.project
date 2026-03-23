from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.achats.models.demande_achat import DemandeAchat
from apps.achats.permissions.achat_permissions import ensure_can_view_demande
from apps.achats.serializers.demande_serializer import (
    DemandeAchatReadSerializer,
    DemandeAchatWriteSerializer,
)
from apps.achats.services.DemandeAchatService import (
    create_demande,
    list_user_demandes,
    submit_demande,
    transmit_demande,
    update_demande,
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_demande_view(request):
    serializer = DemandeAchatWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = create_demande(serializer.validated_data, request.user)

    return Response(
        DemandeAchatReadSerializer(demande).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_demandes_view(request):
    demandes = list_user_demandes(request.user)
    return Response(DemandeAchatReadSerializer(demandes, many=True).data)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def demande_detail_view(request, id):
    demande = get_object_or_404(DemandeAchat, id=id)

    if request.method == "GET":
        ensure_can_view_demande(request.user, demande)
        return Response(DemandeAchatReadSerializer(demande).data)

    serializer = DemandeAchatWriteSerializer(
        demande,
        data=request.data,
        partial=request.method == "PATCH",
    )
    serializer.is_valid(raise_exception=True)

    demande = update_demande(demande, serializer.validated_data, request.user)

    return Response(DemandeAchatReadSerializer(demande).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_demande_view(request, id):
    demande = get_object_or_404(DemandeAchat, id=id)
    demande = submit_demande(demande, request.user)

    return Response(DemandeAchatReadSerializer(demande).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transmit_demande_view(request, id):
    demande = get_object_or_404(DemandeAchat, id=id)
    demande = transmit_demande(demande, request.user)

    return Response(DemandeAchatReadSerializer(demande).data)
