from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.achats.models import DemandeAchat
from apps.achats.serializers.demande_serializer import DemandeAchatSerializer
from apps.achats.serializers.validation_serializer import ValidationDecisionSerializer
from apps.achats.services import list_demandes_a_valider, traiter_validation


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_validations_view(request):
    demandes = list_demandes_a_valider()
    serializer = DemandeAchatSerializer(demandes, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_validate_view(request, demande_id):
    demande = get_object_or_404(DemandeAchat, id=demande_id)

    serializer = ValidationDecisionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    traiter_validation(
        demande=demande,
        user=request.user,
        decision=serializer.validated_data["decision"],
        commentaire=serializer.validated_data.get("commentaire", ""),
    )

    demande.refresh_from_db()
    return Response(DemandeAchatSerializer(demande).data)
