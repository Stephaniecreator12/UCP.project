from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from apps.ppm.services.biens_service import (
    create_biens, update_biens, list_biens,
    compute_planning_biens, compute_status_biens,
    delete_biens_http, stop_biens_http,
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_biens(request):
    try:
        payload = request.data
        obj = create_biens(payload)
        return JsonResponse({"status": "success", "id": obj.id}, status=201)
    except ValidationError as e:
        return JsonResponse({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["PUT", "PATCH", "POST"])
@permission_classes([IsAuthenticated])
def edit_biens(request, id):
    try:
        payload = request.data
        obj = update_biens(id, payload)
        return JsonResponse({"status": "success", "id": obj.id}, status=200)
    except ObjectDoesNotExist:
        return JsonResponse({"error": "Bien non trouvé"}, status=404)
    except ValidationError as e:
        return JsonResponse({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_biens_view(request):
    try:
        return JsonResponse({"biens": list_biens()}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def planning_biens(request):
    try:
        payload = request.data
        dates = compute_planning_biens(
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
def status_biens_view(request):
    try:
        payload = request.data
        statut = compute_status_biens(payload.get("dates_prevues", {}), payload.get("dates_reels", {}))
        return JsonResponse({"statut": statut}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_biens_view(request, id):
    return delete_biens_http(request, id)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_biens_view(request, id):
    return stop_biens_http(request, id)
