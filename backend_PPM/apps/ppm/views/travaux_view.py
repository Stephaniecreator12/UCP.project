from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from apps.ppm.services.travaux_service import (
    create_travaux, update_travaux, list_travaux,
    compute_planning, compute_status,
    delete_travaux_http, stop_travaux_http,
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_travaux(request):
    try:
        payload = request.data
        obj = create_travaux(payload)
        return JsonResponse({"status": "success", "id": obj.id}, status=201)
    except ValidationError as e:
        return JsonResponse({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["PUT", "PATCH", "POST"])
@permission_classes([IsAuthenticated])
def edit_travaux(request, id):
    try:
        payload = request.data
        obj = update_travaux(id, payload)
        return JsonResponse({"status": "success", "id": obj.id}, status=200)
    except ObjectDoesNotExist:
        return JsonResponse({"error": "Travaux non trouvé"}, status=404)
    except ValidationError as e:
        return JsonResponse({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_travaux_view(request):
    try:
        return JsonResponse({"travaux": list_travaux()}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def planning_travaux(request):
    try:
        payload = request.data
        dates = compute_planning(
            payload.get("date_livr"),
            payload.get("methode", "AOI"),
            int(payload.get("duree", 60)),
        )
        return JsonResponse(dates, status=200)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def status_travaux_view(request):
    try:
        payload = request.data
        statut = compute_status(payload.get("dates_prevues", {}), payload.get("dates_reels", {}))
        return JsonResponse({"statut": statut}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_travaux_view(request, id):
    return delete_travaux_http(request, id)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_travaux_view(request, id):
    return stop_travaux_http(request, id)
