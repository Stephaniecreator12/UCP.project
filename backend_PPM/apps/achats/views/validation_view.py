from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.achats.models.demande_achat import DemandeAchat
from apps.achats.services.validation_service import valider_demande


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_validation(request):

    demande = get_object_or_404(
        DemandeAchat,
        id=request.data.get("demande_id")
    )

    decision = request.data.get("decision") or request.data.get("statut")

    validation = valider_demande(
        demande=demande,
        user=request.user,
        decision=decision,
        commentaire=request.data.get("commentaire", "")
    )

    return Response(
        {"id": validation.id},
        status=status.HTTP_201_CREATED
    )
