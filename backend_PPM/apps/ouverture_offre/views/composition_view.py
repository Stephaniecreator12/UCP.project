from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.ouverture_offre.models import SeanceOuverture
from apps.ouverture_offre.permissions import IsSecretaireOuLectureSeule
from apps.ouverture_offre.serializers import (
    CommissionMemberInputSerializer,
    SeanceOuvertureSerializer,
)
from apps.ouverture_offre.services.composition_validation_service import (
    get_composition_detail,
    get_user_composition_role,
    list_composition_pending,
    rejeter_composition,
    soumettre_membres_a_valider,
    valider_composition,
)
from apps.ouverture_offre.services import get_visible_seance


class IsCompositionValidateur(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and get_user_composition_role(request.user)
        )


@api_view(["GET"])
@permission_classes([IsCompositionValidateur])
def composition_pending_list(request):
    return Response(list_composition_pending(request.user))


@api_view(["GET"])
@permission_classes([IsCompositionValidateur])
def composition_detail(request, seance_id):
    return Response(get_composition_detail(seance_id, request.user))


@api_view(["POST"])
@permission_classes([IsCompositionValidateur])
def composition_valider(request, seance_id):
    commentaire = (request.data.get("commentaire") or "").strip()
    seance = valider_composition(seance_id, request.user, commentaire=commentaire)
    return Response({
        "detail": "Composition validée.",
        "seance": SeanceOuvertureSerializer(seance).data,
    })


@api_view(["POST"])
@permission_classes([IsCompositionValidateur])
def composition_rejeter(request, seance_id):
    commentaire = (request.data.get("commentaire") or "").strip()
    seance = rejeter_composition(seance_id, request.user, commentaire=commentaire)
    return Response({
        "detail": "Composition rejetée. Le secrétaire peut corriger et resoumettre.",
        "seance": SeanceOuvertureSerializer(seance).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSecretaireOuLectureSeule])
def seance_soumettre_membres(request, pk):
    seance = get_visible_seance(request.user, pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    serializer = CommissionMemberInputSerializer(
        data=request.data.get("commission_members", []),
        many=True,
    )
    serializer.is_valid(raise_exception=True)

    seance = soumettre_membres_a_valider(
        seance,
        request.user,
        serializer.validated_data,
    )
    response_data = {
        "detail": "Composition soumise à validation CN/GP/RPM.",
        "seance": SeanceOuvertureSerializer(seance).data,
    }
    emails = getattr(seance, "_emails_envoyes", None)
    if emails is not None:
        response_data["emails_envoyes"] = emails
    return Response(response_data, status=status.HTTP_200_OK)
