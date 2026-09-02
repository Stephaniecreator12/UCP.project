from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from apps.ppm.services.consultance_service import (
    create_consultance, update_consultance, list_consultance,
    compute_planning_consultance, compute_status_consultance,
    delete_consultance_http, stop_consultance_http,
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_consultance(request):
    try:
        payload = request.data
        obj = create_consultance(payload)
        return JsonResponse({"status": "success", "id": obj.id}, status=201)
    except ValidationError as e:
        return JsonResponse({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["PUT", "PATCH", "POST"])
@permission_classes([IsAuthenticated])
def edit_consultance(request, id):
    try:
        payload = request.data
        obj = update_consultance(id, payload)
        return JsonResponse({"status": "success", "id": obj.id}, status=200)
    except ObjectDoesNotExist:
        return JsonResponse({"error": "Consultance non trouvée"}, status=404)
    except ValidationError as e:
        return JsonResponse({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_consultance_view(request):
    try:
        return JsonResponse({"consultance": list_consultance()}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def planning_consultance(request):
    try:
        payload = request.data
        dates = compute_planning_consultance(
            payload.get("date_fin"),
            payload.get("methode", "SMC"),
            int(payload.get("duree", 60)),
        )
        return JsonResponse(dates, status=200)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def status_consultance_view(request):
    try:
        payload = request.data
        statut = compute_status_consultance(
            payload.get("dates_prevues", {}),
            payload.get("dates_reels", {}),
            payload.get("est_arrete", False),
        )
        return JsonResponse({"statut": statut}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_consultance_view(request, id):
    return delete_consultance_http(request, id)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_consultance_view(request, id):
    return stop_consultance_http(request, id)
