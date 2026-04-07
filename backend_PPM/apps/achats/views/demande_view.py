from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.achats.models import DemandeAchat
from apps.achats.serializers import DemandeAchatSerializer
from apps.achats.serializers.demande_serializer import (
    CloseDemandeSerializer,
    DocumentDemandeSerializer,
    IssueOrderSerializer,
    ReceiveDemandeSerializer,
    UpdateDeliverySerializer,
)
from apps.achats.services import (
    add_document_to_demande,
    close_demande,
    create_demande,
    issue_order,
    list_demandes_a_commander,
    list_mes_demandes,
    receive_demande,
    submit_demande,
    update_delivery,
)


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
def passation_pending_view(request):
    demandes = list_demandes_a_commander(request.user)
    serializer = DemandeAchatSerializer(demandes, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def demande_detail_view(request, demande_id):
    demande = get_object_or_404(
        DemandeAchat.objects.prefetch_related(
            "lignes_besoin",
            "documents",
            "validations__validateur",
            "historiques__user",
        ),
        id=demande_id,
        demandeur=request.user,
    )
    serializer = DemandeAchatSerializer(demande)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def demande_document_upload_view(request, demande_id):
    demande = get_object_or_404(DemandeAchat, id=demande_id)
    serializer = DocumentDemandeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    document = add_document_to_demande(
        demande,
        serializer.validated_data,
        request.user,
    )

    return Response(
        DocumentDemandeSerializer(document).data,
        status=status.HTTP_201_CREATED,
    )

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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_issue_order_view(request, demande_id):
    demande = get_object_or_404(DemandeAchat, id=demande_id)
    serializer = IssueOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = issue_order(demande, serializer.validated_data, request.user)
    return Response(DemandeAchatSerializer(demande).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_update_delivery_view(request, demande_id):
    demande = get_object_or_404(
        DemandeAchat.objects.prefetch_related("lignes_besoin"),
        id=demande_id,
    )
    serializer = UpdateDeliverySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = update_delivery(demande, serializer.validated_data, request.user)
    return Response(DemandeAchatSerializer(demande).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_receive_view(request, demande_id):
    demande = get_object_or_404(
        DemandeAchat.objects.prefetch_related(
            "lignes_besoin",
            "documents",
            "validations__validateur",
            "historiques__user",
        ),
        id=demande_id,
    )
    serializer = ReceiveDemandeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = receive_demande(demande, serializer.validated_data, request.user)
    demande.refresh_from_db()
    return Response(DemandeAchatSerializer(demande).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_close_view(request, demande_id):
    demande = get_object_or_404(DemandeAchat, id=demande_id)
    serializer = CloseDemandeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = close_demande(demande, serializer.validated_data, request.user)
    return Response(DemandeAchatSerializer(demande).data)
