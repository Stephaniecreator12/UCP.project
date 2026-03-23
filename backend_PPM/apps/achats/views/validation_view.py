from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.achats.models.demande_achat import DemandeAchat
from apps.achats.serializers.demande_serializer import DemandeAchatReadSerializer
from apps.achats.serializers.validation_serializer import ValidationDecisionSerializer
from apps.achats.services.validation_service import (
    list_pending_demandes,
    valider_demande,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_validations_view(request):
    demandes = list_pending_demandes(request.user)
    return Response(DemandeAchatReadSerializer(demandes, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def decision_validation_view(request):
    serializer = ValidationDecisionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = get_object_or_404(
        DemandeAchat,
        id=serializer.validated_data["demande_id"],
    )

    valider_demande(
        demande=demande,
        user=request.user,
        decision=serializer.validated_data["decision"],
        commentaire=serializer.validated_data.get("commentaire", ""),
        fonds_statut=serializer.validated_data.get("fonds_statut"),
        visa=serializer.validated_data.get("visa", ""),
    )

    demande.refresh_from_db()
    return Response(DemandeAchatReadSerializer(demande).data)
