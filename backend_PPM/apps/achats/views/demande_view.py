from django.db.models import Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.achats.models import DemandeAchat, DocumentDemande
from apps.achats.serializers.demande_serializer import (
    BudgetEstimationSerializer,
    CloseDemandeSerializer,
    DemandeAchatSerializer,
    DocumentDemandeSerializer,
    IssueOrderSerializer,
    ReceiveDemandeSerializer,
    ResolveReceptionIssueSerializer,
    UpdateDeliverySerializer,
)
from apps.achats.services import (
    add_document_to_demande,
    close_demande,
    complete_budget_estimation,
    create_demande,
    get_user_validation_step,
    issue_order,
    is_agent_achat,
    is_agent_marche,
    is_finance,
    list_demandes_a_commander,
    list_demandes_budgetaires,
    list_mes_demandes,
    receive_demande,
    resolve_reception_issue,
    submit_demande,
    update_demande,
    update_delivery,
)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def demande_list_create_view(request):
    if request.method == "GET":
        demandes = list_mes_demandes(request.user)
        serializer = DemandeAchatSerializer(demandes, many=True)
        return Response(serializer.data)

    serializer = DemandeAchatSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = create_demande(serializer.validated_data, request.user)

    return Response(
        DemandeAchatSerializer(demande).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def demande_detail_view(request, demande_id):
    from django.db.models import Prefetch
    from apps.achats.models import ValidationDemande, HistoriqueDemande

    demande_qs = DemandeAchat.objects.prefetch_related(
        "lignes_besoin",
        "documents",
        Prefetch(
            "validations",
            queryset=ValidationDemande.objects.select_related("validateur"),
        ),
        Prefetch(
            "historiques",
            queryset=HistoriqueDemande.objects.select_related("user"),
        ),
    )
    
    demande = get_object_or_404(demande_qs, id=demande_id)
    
    # Check permissions
    is_owner = demande.demandeur == request.user
    role_check = is_agent_achat(request.user) or is_finance(request.user) or is_agent_marche(request.user) or get_user_validation_step(request.user)
    
    if not (is_owner or role_check):
        return Response({"detail": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        serializer = DemandeAchatSerializer(demande)
        return Response(serializer.data)
        
    elif request.method == "PATCH":
        serializer = DemandeAchatSerializer(data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        demande = update_demande(demande, serializer.validated_data, request.user)
        return Response(DemandeAchatSerializer(demande).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def passation_pending_view(request):
    demandes = list_demandes_a_commander(request.user)
    serializer = DemandeAchatSerializer(demandes, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def finance_pending_view(request):
    demandes = list_demandes_budgetaires(request.user)
    serializer = DemandeAchatSerializer(demandes, many=True)
    return Response(serializer.data)





@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def demande_document_upload_view(request, demande_id):
    demande = get_object_or_404(DemandeAchat, id=demande_id)
    serializer = DocumentDemandeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    document = add_document_to_demande(
        demande,
        serializer.validated_data,
        request.user,
    )

    return Response(
        DocumentDemandeSerializer(document).data,
        status=status.HTTP_201_CREATED,
    )


def _document_visibility_queryset(user):
    filters = Q(demande__demandeur=user)

    if is_agent_achat(user):
        filters |= Q(
            demande__statut__in=[
                DemandeAchat.STATUT_VALIDEE_BUDGETAIRE,
                DemandeAchat.STATUT_EN_COMMANDE,
                DemandeAchat.STATUT_EN_LIVRAISON,
            ]
        )

    if is_finance(user):
        filters |= Q(
            demande__statut__in=[
                DemandeAchat.STATUT_VALIDEE,
                DemandeAchat.STATUT_VALIDEE_BUDGETAIRE,
                DemandeAchat.STATUT_EN_COMMANDE,
                DemandeAchat.STATUT_EN_LIVRAISON,
                DemandeAchat.STATUT_LIVREE,
                DemandeAchat.STATUT_CLOTUREE,
            ]
        )

    if is_agent_marche(user):
        filters |= Q(
            demande__statut__in=[
                DemandeAchat.STATUT_EN_COMMANDE,
                DemandeAchat.STATUT_EN_LIVRAISON,
                DemandeAchat.STATUT_LIVREE,
                DemandeAchat.STATUT_CLOTUREE,
            ]
        )

    validation_step = get_user_validation_step(user)
    if validation_step:
        filters |= Q(
            demande__statut=DemandeAchat.STATUT_SOUMISE,
            demande__etape_validation_actuelle=validation_step,
        )

    return DocumentDemande.objects.select_related("demande").filter(filters)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def demande_document_file_view(request, document_id):
    document = get_object_or_404(
        _document_visibility_queryset(request.user),
        id=document_id,
    )

    if not document.fichier:
        return Response(
            {"detail": "Fichier introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    filename = document.fichier.name.rsplit("/", 1)[-1]
    response = FileResponse(
        document.fichier.open("rb"),
        as_attachment=False,
        filename=filename,
    )
    response["X-Content-Type-Options"] = "nosniff"
    return response

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_submit_view(request, demande_id):
    demande = get_object_or_404(
        DemandeAchat,
        id=demande_id,
    )

    demande = submit_demande(demande, request.user)
    serializer = DemandeAchatSerializer(demande)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_issue_order_view(request, demande_id):
    demande = get_object_or_404(DemandeAchat, id=demande_id)
    serializer = IssueOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = issue_order(demande, serializer.validated_data, request.user)
    return Response(DemandeAchatSerializer(demande).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_budget_view(request, demande_id):
    demande = get_object_or_404(DemandeAchat, id=demande_id)
    serializer = BudgetEstimationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = complete_budget_estimation(demande, serializer.validated_data, request.user)
    return Response(DemandeAchatSerializer(demande).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_update_delivery_view(request, demande_id):
    demande = get_object_or_404(
        DemandeAchat.objects.prefetch_related("lignes_besoin"),
        id=demande_id,
    )
    serializer = UpdateDeliverySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = update_delivery(demande, serializer.validated_data, request.user)
    return Response(DemandeAchatSerializer(demande).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_receive_view(request, demande_id):
    demande = get_object_or_404(
        DemandeAchat.objects.prefetch_related(
            "lignes_besoin",
            "documents",
            "validations__validateur",
            "historiques__user",
        ),
        id=demande_id,
    )
    serializer = ReceiveDemandeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = receive_demande(demande, serializer.validated_data, request.user)
    demande.refresh_from_db()
    return Response(DemandeAchatSerializer(demande).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_resolve_issue_view(request, demande_id):
    demande = get_object_or_404(
        DemandeAchat.objects.prefetch_related(
            "lignes_besoin",
            "documents",
            "validations__validateur",
            "historiques__user",
        ),
        id=demande_id,
    )
    serializer = ResolveReceptionIssueSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = resolve_reception_issue(demande, serializer.validated_data, request.user)
    demande.refresh_from_db()
    return Response(DemandeAchatSerializer(demande).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_close_view(request, demande_id):
    demande = get_object_or_404(DemandeAchat, id=demande_id)
    serializer = CloseDemandeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    demande = close_demande(demande, serializer.validated_data, request.user)
    return Response(DemandeAchatSerializer(demande).data)
