from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from apps.ppm.serializers.biens_serializer import BiensSerializer
from apps.ppm.services.biens_service import (
    create_biens, update_biens, list_biens,
    compute_planning_biens, compute_status_biens,
    delete_biens_http, stop_biens_http,
)
from apps.ppm.services.procurement_service import save_statut_service


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_biens(request):
    serializer = BiensSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    try:
        obj = create_biens(serializer.validated_data)
        return Response({"status": "success", "id": obj.id}, status=status.HTTP_201_CREATED)
    except ValidationError as e:
        return Response({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"error": "Erreur interne lors de la création des biens"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT", "PATCH", "POST"])
@permission_classes([IsAuthenticated])
def edit_biens(request, id):
    serializer = BiensSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    try:
        obj = update_biens(id, serializer.validated_data)
        return Response({"status": "success", "id": obj.id}, status=status.HTTP_200_OK)
    except ObjectDoesNotExist:
        return Response({"error": "Bien non trouvé"}, status=status.HTTP_404_NOT_FOUND)
    except ValidationError as e:
        return Response({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"error": "Erreur interne lors de la mise à jour des biens"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_biens_view(request):
    try:
        return Response({"biens": list_biens()}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"error": "Erreur interne lors de la récupération des biens"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        return Response(dates, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"error": "Erreur interne lors du calcul du planning"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def status_biens_view(request):
    try:
        payload = request.data
        statut = compute_status_biens(payload.get("dates_prevues", {}), payload.get("dates_reels", {}))
        return Response({"statut": statut}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"error": "Erreur interne lors du calcul du statut"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_biens_view(request, id):
    return delete_biens_http(request, id)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_biens_view(request, id):
    return stop_biens_http(request, id)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def save_statut_biens(request, id):
    from apps.ppm.models.Biens import Biens
    return save_statut_service(request, Biens, id)
