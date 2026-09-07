from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from apps.ppm.serializers.travaux_serializer import TravauxSerializer
from apps.ppm.services.travaux_service import (
    create_travaux, update_travaux, list_travaux,
    compute_planning, compute_status,
    delete_travaux_http, stop_travaux_http,
)
from apps.ppm.services.procurement_service import save_statut_service


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_travaux(request):
    serializer = TravauxSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    try:
        obj = create_travaux(serializer.validated_data)
        return Response({"status": "success", "id": obj.id}, status=status.HTTP_201_CREATED)
    except ValidationError as e:
        return Response({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"error": "Erreur interne lors de la création des travaux"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT", "PATCH", "POST"])
@permission_classes([IsAuthenticated])
def edit_travaux(request, id):
    serializer = TravauxSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    try:
        obj = update_travaux(id, serializer.validated_data)
        return Response({"status": "success", "id": obj.id}, status=status.HTTP_200_OK)
    except ObjectDoesNotExist:
        return Response({"error": "Travaux non trouvé"}, status=status.HTTP_404_NOT_FOUND)
    except ValidationError as e:
        return Response({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"error": "Erreur interne lors de la mise à jour des travaux"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_travaux_view(request):
    try:
        return Response({"travaux": list_travaux()}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"error": "Erreur interne lors de la récupération des travaux"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        return Response(dates, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"error": "Erreur interne lors du calcul du planning"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def status_travaux_view(request):
    try:
        payload = request.data
        statut = compute_status(payload.get("dates_prevues", {}), payload.get("dates_reels", {}))
        return Response({"statut": statut}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"error": "Erreur interne lors du calcul du statut"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_travaux_view(request, id):
    return delete_travaux_http(request, id)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_travaux_view(request, id):
    return stop_travaux_http(request, id)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def save_statut_travaux(request, id):
    from apps.ppm.models.Travaux import Travaux
    return save_statut_service(request, Travaux, id)
