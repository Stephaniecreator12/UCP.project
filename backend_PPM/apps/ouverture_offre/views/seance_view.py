from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.ouverture_offre.permissions import IsSecretaireOuLectureSeule
from apps.ouverture_offre.serializers import (
    RejetSeanceSerializer,
    SeanceOuvertureSerializer,
    ValidationMembreSerializer,
    ValidationPresidentSerializer)

from apps.ouverture_offre.services import (
    create_seance,
    get_visible_seance,
    list_visible_seances,
    reject_member,
    reject_president,
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

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def seance_validate_member(request, pk):
    seance = get_visible_seance(request.user, pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ValidationMembreSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)

    ip_adresse = get_client_ip(request)
    navigateur = request.META.get('HTTP_USER_AGENT', '')

    validate_member(
        seance,
        request.user,
        serializer.validated_data.get("commentaire", ""),
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )

    seance = get_visible_seance(request.user, pk)

    return Response(SeanceOuvertureSerializer(seance).data, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def seance_validate_president(request, pk):
    seance = get_visible_seance(request.user, pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ValidationPresidentSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)

    ip_adresse = get_client_ip(request)
    navigateur = request.META.get('HTTP_USER_AGENT', '')

    validate_president(
        seance,
        request.user,
        serializer.validated_data.get("commentaire", ""),
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )

    seance = get_visible_seance(request.user, pk)

    return Response(SeanceOuvertureSerializer(seance).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def seance_reject_member(request, pk):
    seance = get_visible_seance(request.user, pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    serializer = RejetSeanceSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)

    ip_adresse = get_client_ip(request)
    navigateur = request.META.get('HTTP_USER_AGENT', '')

    reject_member(
        seance,
        request.user,
        serializer.validated_data.get("commentaire", ""),
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )

    seance = get_visible_seance(request.user, pk)

    return Response(SeanceOuvertureSerializer(seance).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def seance_reject_president(request, pk):
    seance = get_visible_seance(request.user, pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    serializer = RejetSeanceSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)

    ip_adresse = get_client_ip(request)
    navigateur = request.META.get('HTTP_USER_AGENT', '')

    reject_president(
        seance,
        request.user,
        serializer.validated_data.get("commentaire", ""),
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )

    seance = get_visible_seance(request.user, pk)

    return Response(SeanceOuvertureSerializer(seance).data, status=status.HTTP_200_OK)


from django.http import FileResponse

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_pv(request, pk):
    seance = get_visible_seance(request.user, pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        pv_document = seance.pv_document
    except Exception:
        from apps.ouverture_offre.models import SeanceOuverture
        if seance.statut in [SeanceOuverture.Statut.VALIDEE, SeanceOuverture.Statut.ARCHIVEE]:
            try:
                from apps.ouverture_offre.services.pdf_service import generate_and_archive_pv
                pv_document = generate_and_archive_pv(seance)
            except Exception as e:
                return Response(
                    {"detail": f"Erreur lors de la génération automatique du PV : {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            return Response(
                {"detail": "Le PV n'a pas encore ete genere pour cette seance."},
                status=status.HTTP_404_NOT_FOUND,
            )

    response = FileResponse(pv_document.fichier.open('rb'), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{pv_document.fichier.name}"'
    return response
