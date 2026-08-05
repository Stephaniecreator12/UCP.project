from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.ouverture_offre.models import SeanceOuverture
from apps.ouverture_offre.permissions import IsSecretaireOuLectureSeule
from apps.ouverture_offre.serializers import (
    RejetSeanceSerializer,
    SeanceOuvertureSerializer,
    ValidationAccessSerializer,
    ValidationDecisionSerializer,
    ValidationMembreSerializer,
    ValidationPresidentSerializer)

from apps.ouverture_offre.services import (
    create_seance,
    get_public_validation_seance,
    get_visible_seance,
    list_visible_seances,
    reject_member,
    reject_member_with_password,
    reject_president,
    reject_president_with_password,
    report_president_with_password,
    resend_validation_notifications,
    update_seance,
    validate_member,
    validate_member_with_password,
    validate_president,
    validate_president_with_password,
)
from apps.ouverture_offre.services.validation_access_service import (
    check_president_password,
    get_member_with_password,
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
    response_data = SeanceOuvertureSerializer(seance).data
    emails_envoyes = getattr(seance, "_emails_envoyes", None)
    if emails_envoyes is not None:
        response_data["emails_envoyes"] = emails_envoyes
    return Response(
        response_data,
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
    response_data = SeanceOuvertureSerializer(seance).data
    emails_envoyes = getattr(seance, "_emails_envoyes", None)
    if emails_envoyes is not None:
        response_data["emails_envoyes"] = emails_envoyes
    return Response(response_data)


def _validation_context_response(seance, role, user):
    if role == "membre":
        actions = ["VALIDER", "REJETER"]
    else:
        actions = ["APPROUVER", "REJETER", "REPORTER"]

    from apps.procurement.models.procurement_market import ProcurementMarket
    from apps.procurement.serializers.procurement_market_serializer import ProcurementMarketSerializer

    market = ProcurementMarket.objects.filter(reference_number=seance.reference_dossier).first()
    market_data = ProcurementMarketSerializer(market).data if market else None

    full_name = f"{user.first_name} {user.last_name}".strip() or user.username
    return {
        "role": role,
        "participant": {
            "id": user.id,
            "full_name": full_name,
            "email": user.email,
        },
        "actions": actions,
        "seance": SeanceOuvertureSerializer(seance).data,
        "market": market_data,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def seance_validation_access(request, pk):
    seance = get_public_validation_seance(pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ValidationAccessSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    role = serializer.validated_data["role"]
    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    if role == "membre":
        if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
            return Response(
                {"detail": "Cette seance n'est pas en validation des membres."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        membre = get_member_with_password(seance, email, password)
        return Response(_validation_context_response(seance, role, membre.utilisateur))

    if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_PRESIDENT:
        return Response(
            {"detail": "Cette seance n'est pas en validation president."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    president = check_president_password(seance, email, password)
    return Response(_validation_context_response(seance, role, president))


@api_view(["POST"])
@permission_classes([AllowAny])
def seance_validation_decision(request, pk):
    seance = get_public_validation_seance(pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ValidationDecisionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    ip_adresse = get_client_ip(request)
    navigateur = request.META.get("HTTP_USER_AGENT", "")
    commentaire = data.get("commentaire", "")

    if data["role"] == "membre":
        if data["decision"] == "VALIDER":
            validate_member_with_password(
                seance,
                data["email"],
                data["password"],
                commentaire=commentaire,
                ip_adresse=ip_adresse,
                navigateur=navigateur,
            )
        else:
            reject_member_with_password(
                seance,
                data["email"],
                data["password"],
                commentaire=commentaire,
                ip_adresse=ip_adresse,
                navigateur=navigateur,
            )
    elif data["decision"] == "APPROUVER":
        validate_president_with_password(
            seance,
            data["email"],
            data["password"],
            commentaire=commentaire,
            ip_adresse=ip_adresse,
            navigateur=navigateur,
        )
    elif data["decision"] == "REJETER":
        reject_president_with_password(
            seance,
            data["email"],
            data["password"],
            commentaire=commentaire,
            ip_adresse=ip_adresse,
            navigateur=navigateur,
        )
    else:
        report_president_with_password(
            seance,
            data["email"],
            data["password"],
            data["date_report"],
            commentaire=commentaire,
            ip_adresse=ip_adresse,
            navigateur=navigateur,
        )

    refreshed = get_public_validation_seance(pk)
    market_data = None
    if refreshed:
        from apps.procurement.models.procurement_market import ProcurementMarket
        from apps.procurement.serializers.procurement_market_serializer import ProcurementMarketSerializer
        market = ProcurementMarket.objects.filter(reference_number=refreshed.reference_dossier).first()
        market_data = ProcurementMarketSerializer(market).data if market else None

    return Response(
        {
            "detail": "Decision enregistree. Le mot de passe de validation est maintenant desactive.",
            "seance": SeanceOuvertureSerializer(refreshed).data if refreshed else None,
            "market": market_data,
        },
        status=status.HTTP_200_OK,
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSecretaireOuLectureSeule])
def seance_resend_invitations(request, pk):
    seance = get_visible_seance(request.user, pk)
    if not seance:
        return Response({"detail": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    payload = resend_validation_notifications(seance, request.user)
    return Response(payload, status=status.HTTP_200_OK)

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
        if seance.statut == SeanceOuverture.Statut.VALIDEE:
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
    # Allow inline preview when requested (e.g. ?inline=1), otherwise force attachment
    inline_param = str(request.GET.get('inline', '')).lower()
    if inline_param in ("1", "true", "yes"):
        disposition_type = "inline"
    else:
        disposition_type = "attachment"

    # Use basename for filename to avoid full path in header
    try:
        from os.path import basename

        filename = basename(pv_document.fichier.name)
    except Exception:
        filename = pv_document.fichier.name

    response['Content-Disposition'] = f'{disposition_type}; filename="{filename}"'
    return response
