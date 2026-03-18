import json
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.ppm.services.biens_service import (
    create_biens, update_biens, list_biens,
    compute_planning_biens, compute_status_biens,
    delete_biens_http, stop_biens_http,
)

@api_view(["POST"])
def add_biens(request):
    payload = json.loads(request.body)
    obj = create_biens(payload)
    return JsonResponse({"status": "success", "id": obj.id}, status=201)

@api_view(["PUT", "PATCH", "POST"])
def edit_biens(request, id):
    payload = json.loads(request.body)
    obj = update_biens(id, payload)
    return JsonResponse({"status": "success", "id": obj.id}, status=200)

@api_view(["GET"])
def list_biens_view(request):
    return JsonResponse({"biens": list_biens()}, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def planning_biens(request):
    payload = json.loads(request.body)
    dates = compute_planning_biens(
        payload.get("date_livr"),
        payload.get("methode", "AOI"),
        int(payload.get("duree", 60)),
    )
    return JsonResponse(dates, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def status_biens_view(request):
    payload = json.loads(request.body)
    statut = compute_status_biens(payload.get("dates_prevues", {}), payload.get("dates_reels", {}))
    return JsonResponse({"statut": statut}, status=200)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_biens_view(request, id):
    return delete_biens_http(request, id)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_biens_view(request, id):
    return stop_biens_http(request, id)
