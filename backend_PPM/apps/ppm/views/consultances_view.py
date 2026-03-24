import json
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.ppm.services.consultance_service import (
    create_consultance, update_consultance, list_consultance,
    compute_planning_consultance, compute_status_consultance,
    delete_consultance_http, stop_consultance_http,
)

@api_view(["POST"])
def add_consultance(request):
    payload = json.loads(request.body)
    obj = create_consultance(payload)
    return JsonResponse({"status": "success", "id": obj.id}, status=201)

@api_view(["PUT", "PATCH", "POST"])
def edit_consultance(request, id):
    payload = json.loads(request.body)
    obj = update_consultance(id, payload)
    return JsonResponse({"status": "success", "id": obj.id}, status=200)

@api_view(["GET"])
def list_consultance_view(request):
    return JsonResponse({"consultance": list_consultance()}, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def planning_consultance(request):
    payload = json.loads(request.body)
    dates = compute_planning_consultance(
        payload.get("date_fin"),
        payload.get("methode", "SMC"),
        int(payload.get("duree", 60)),
    )
    return JsonResponse(dates, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def status_consultance_view(request):
    payload = json.loads(request.body)
    statut = compute_status_consultance(
        payload.get("dates_prevues", {}),
        payload.get("dates_reels", {}),
        payload.get("est_arrete", False),
    )
    return JsonResponse({"statut": statut}, status=200)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_consultance_view(request, id):
    return delete_consultance_http(request, id)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_consultance_view(request, id):
    return stop_consultance_http(request, id)
