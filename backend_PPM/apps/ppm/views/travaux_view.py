import json
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.ppm.services.travaux_service import (
    create_travaux, update_travaux, list_travaux,
    compute_planning, compute_status,
    delete_travaux_http, stop_travaux_http,
)

@api_view(["POST"])
def add_travaux(request):
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    obj = create_travaux(payload)
    return JsonResponse({"status": "success", "id": obj.id}, status=201)

@api_view(["PUT", "PATCH", "POST"])
def edit_travaux(request, id):
    payload = json.loads(request.body)
    obj = update_travaux(id, payload)
    return JsonResponse({"status": "success", "id": obj.id}, status=200)

@api_view(["GET"])
def list_travaux_view(request):
    return JsonResponse({"travaux": list_travaux()}, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def planning_travaux(request):
    payload = json.loads(request.body)
    dates = compute_planning(
        payload.get("date_livr"),
        payload.get("methode", "AOI"),
        int(payload.get("duree", 60)),
    )
    return JsonResponse(dates, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def status_travaux_view(request):
    payload = json.loads(request.body)
    statut = compute_status(payload.get("dates_prevues", {}), payload.get("dates_reels", {}))
    return JsonResponse({"statut": statut}, status=200)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_travaux_view(request, id):
    return delete_travaux_http(request, id)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_travaux_view(request, id):
    return stop_travaux_http(request, id)
