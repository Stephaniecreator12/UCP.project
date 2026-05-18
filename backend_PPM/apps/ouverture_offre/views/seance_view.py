from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.ouverture_offre.permissions import IsSecretaireOuLectureSeule
from apps.ouverture_offre.serializers import (
    SeanceOuvertureSerializer,
    ValidationMembreSerializer,
    ValidationPresidentSerializer)

from apps.ouverture_offre.services import (
    create_seance,
    get_visible_seance,
    list_visible_seances,
    update_seance,
    validate_member,
    validate_president,
)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsSecretaireOuLectureSeule])
def seance_list_create(request):
    if request.method == "GET":
        seances = list_visible_seances(request.user)
        serializer = SeanceOuvertureSerializer(seances, many=True)
        return Response(serializer.data)

    serializer = SeanceOuvertureSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    seance = create_seance(serializer.validated_data, request.user)
    return Response(
        SeanceOuvertureSerializer(seance).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated, IsSecretaireOuLectureSeule])
def seance_detail(request, pk):
    seance = get_visible_seance(request.user, pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = SeanceOuvertureSerializer(seance)
        return Response(serializer.data)

    serializer = SeanceOuvertureSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    seance = update_seance(seance, serializer.validated_data, request.user)
    return Response(SeanceOuvertureSerializer(seance).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def seance_validate_member(request, pk):
    seance = get_visible_seance(request.user, pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ValidationMembreSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    validate_member(
        seance,
        request.user,
        serializer.validated_data.get("commentaire", ""),
    )

    seance = get_visible_seance(request.user, pk)

    return Response(SeanceOuvertureSerializer(seance).data, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def seance_validate_president(request, pk):
    seance = get_visible_seance(request.user, pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ValidationPresidentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    validate_president(
        seance,
        request.user,
        serializer.validated_data.get("commentaire", ""),
    )

    seance = get_visible_seance(request.user, pk)

    return Response(SeanceOuvertureSerializer(seance).data, status=status.HTTP_200_OK)
