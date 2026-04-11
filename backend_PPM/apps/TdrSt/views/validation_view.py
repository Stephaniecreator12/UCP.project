from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.TdrSt.models.TdrSt import TdrStDocument
from apps.TdrSt.permissions import CanBailleurRead, CanFinalApprove, CanTechValidate, CanReadDocument, CanAuditeurRead
from apps.TdrSt.serializers.decision_serializer import AnoDecisionSerializer, FinalDecisionSerializer, TechDecisionSerializer
from apps.TdrSt.serializers.document_serializer import TdrStDocumentReadSerializer
from apps.TdrSt.services.TdrStService import (
    bailleur_decide,
    final_decide,
    list_bailleur_documents_all,
    list_final_documents,
    list_bailleur_documents,
    list_pending_final,
    list_pending_tech,
    list_tech_documents,
    tech_decide,
    list_auditeur_documents
)


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanTechValidate])
def tech_pending_view(request):
    docs = list_pending_tech()
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated, CanTechValidate])
def tech_documents_view(request):
    docs = list_tech_documents(request.user)
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, CanTechValidate])
def tech_decision_view(request, id: int):
    doc = get_object_or_404(TdrStDocument, id=id)
    perm = CanReadDocument()
    if not perm.has_object_permission(request, None, doc):
        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    serializer = TechDecisionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    doc = tech_decide(
        doc,
        request.user,
        decision=serializer.validated_data["decision"],
        observations=serializer.validated_data.get("observations", "") or "",
    )
    return Response(TdrStDocumentReadSerializer(doc).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanFinalApprove])
def final_pending_view(request):
    docs = list_pending_final()
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated, CanFinalApprove])
def final_documents_view(request):
    docs = list_final_documents(request.user)
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, CanFinalApprove])
def final_decision_view(request, id: int):
    doc = get_object_or_404(TdrStDocument, id=id)
    perm = CanReadDocument()
    if not perm.has_object_permission(request, None, doc):
        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    serializer = FinalDecisionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    doc = final_decide(
        doc,
        request.user,
        decision=serializer.validated_data["decision"],
        observations=serializer.validated_data.get("observations", "") or "",
    )
    return Response(TdrStDocumentReadSerializer(doc).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanBailleurRead])
def bailleur_documents_view(request):
    docs = list_bailleur_documents()
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated, CanBailleurRead])
def bailleur_documents_all_view(request):
    docs = list_bailleur_documents_all(request.user)
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, CanBailleurRead])
def bailleur_decision_view(request, id: int):
    doc = get_object_or_404(TdrStDocument, id=id)
    perm = CanReadDocument()
    if not perm.has_object_permission(request, None, doc):
        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    serializer = AnoDecisionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    doc = bailleur_decide(
        doc,
        request.user,
        decision=serializer.validated_data["decision"],
        observations=serializer.validated_data.get("observations", "") or "",
    )
    return Response(TdrStDocumentReadSerializer(doc).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated, CanAuditeurRead])
def auditeur_documents_view(request):
    docs = list_auditeur_documents()
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)