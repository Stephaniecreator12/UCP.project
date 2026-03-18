import json
from django.http import JsonResponse
from rest_framework.decorators import api_view

from apps.achats.services.DemandeAchatService import (
    create_demande,
    list_demandes,
)


@api_view(["POST"])
def add_demande(request):

    payload = json.loads(request.body)

    demande = create_demande(payload)

    return JsonResponse({"id": demande.id})


@api_view(["GET"])
def list_demandes_view(request):

    return JsonResponse({
        "demandes": list_demandes()
    })