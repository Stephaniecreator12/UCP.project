from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from apps.ppm.serializers.consultance_serializer import ConsultanceSerializer
from apps.ppm.services.consultance_service import (
    create_consultance, update_consultance, list_consultance,
    compute_planning_consultance, compute_status_consultance,
    delete_consultance_http, stop_consultance_http,
)
from apps.ppm.services.procurement_service import save_statut_service


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_consultance(request):
    serializer = ConsultanceSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    try:
        obj = create_consultance(serializer.validated_data)
        return Response({"status": "success", "id": obj.id}, status=status.HTTP_201_CREATED)
    except ValidationError as e:
        return Response({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"error": "Erreur interne lors de la création de la consultance"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT", "PATCH", "POST"])
@permission_classes([IsAuthenticated])
def edit_consultance(request, id):
    serializer = ConsultanceSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    try:
        obj = update_consultance(id, serializer.validated_data)
        return Response({"status": "success", "id": obj.id}, status=status.HTTP_200_OK)
    except ObjectDoesNotExist:
        return Response({"error": "Consultance non trouvée"}, status=status.HTTP_404_NOT_FOUND)
    except ValidationError as e:
        return Response({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"error": "Erreur interne lors de la mise à jour de la consultance"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_consultance_view(request):
    try:
        return Response({"consultance": list_consultance()}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"error": "Erreur interne lors de la récupération des consultances"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        return Response(dates, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"error": "Erreur interne lors du calcul du planning"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        return Response({"statut": statut}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"error": "Erreur interne lors du calcul du statut"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_consultance_view(request, id):
    return delete_consultance_http(request, id)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_consultance_view(request, id):
    return stop_consultance_http(request, id)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def save_statut_consultance(request, id):
    from apps.ppm.models.Consultances import Consultance
    return save_statut_service(request, Consultance, id)
