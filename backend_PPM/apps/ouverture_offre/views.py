from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import SeanceOuvertureSerializer, SimpleUserSerializer
from .models import SeanceOuverture

User = get_user_model()


def get_visible_seances(user):
    return (
        SeanceOuverture.objects.select_related("secretaire", "president")
        .prefetch_related("membres__utilisateur")
        .filter(
            Q(secretaire=user)
            | Q(president=user)
            | Q(membres__utilisateur=user)
        )
        .distinct()
        .order_by("-created_at")
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def available_users(request):
    users = User.objects.filter(is_active=True).order_by("first_name", "last_name", "username")
    serializer = SimpleUserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def seance_list_create(request):
    if request.method == "GET":
        seances = get_visible_seances(request.user)
        serializer = SeanceOuvertureSerializer(seances, many=True)
        return Response(serializer.data)

    serializer = SeanceOuvertureSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        seance = serializer.save()
        return Response(
            SeanceOuvertureSerializer(seance).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def seance_detail(request, pk):
    seance = get_visible_seances(request.user).filter(pk=pk).first()
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = SeanceOuvertureSerializer(seance)
        return Response(serializer.data)

    if seance.secretaire_id != request.user.id:
        return Response(
            {"detail": "Seul le secretaire de cette seance peut la modifier."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = SeanceOuvertureSerializer(
        seance,
        data=request.data,
        partial=True,
        context={"request": request},
    )
    if serializer.is_valid():
        seance = serializer.save()
        return Response(SeanceOuvertureSerializer(seance).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
