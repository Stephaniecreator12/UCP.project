from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.TdrSt.models.TdrSt import TdrStDocument
<<<<<<< HEAD
from apps.TdrSt.permissions import CanBailleurRead, CanFinalApprove, CanTechValidate, CanReadDocument, CanAuditeurRead
from apps.TdrSt.serializers.decision_serializer import AnoDecisionSerializer, FinalDecisionSerializer, TechDecisionSerializer
from apps.TdrSt.serializers.document_serializer import TdrStDocumentReadSerializer
from apps.TdrSt.services.TdrStService import (
    bailleur_decide,
    final_decide,
    list_bailleur_documents_all,
    list_final_documents,
    list_bailleur_documents,
=======
from apps.TdrSt.permissions import  CanFinalApprove, CanTechValidate, CanReadDocument, CanAuditeurRead
from apps.TdrSt.serializers.decision_serializer import FinalDecisionSerializer, TechDecisionSerializer
from apps.TdrSt.serializers.document_serializer import TdrStDocumentReadSerializer
from apps.TdrSt.services.schema_compat import (
    MISSING_TDR_LINK_MIGRATION_MESSAGE,
    has_tdr_demande_link_column,
)
from apps.TdrSt.services.TdrStService import (
    final_decide,
    list_final_documents,
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    list_pending_final,
    list_pending_tech,
    list_tech_documents,
    tech_decide,
    list_auditeur_documents
)


<<<<<<< HEAD
@api_view(["GET"])
@permission_classes([IsAuthenticated, CanTechValidate])
def tech_pending_view(request):
=======
def _missing_link_response():
    return Response(
        {"detail": MISSING_TDR_LINK_MIGRATION_MESSAGE},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanTechValidate])
def tech_pending_view(request):
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    docs = list_pending_tech()
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated, CanTechValidate])
def tech_documents_view(request):
<<<<<<< HEAD
=======
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    docs = list_tech_documents(request.user)
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, CanTechValidate])
def tech_decision_view(request, id: int):
<<<<<<< HEAD
=======
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
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
<<<<<<< HEAD
=======
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    docs = list_pending_final()
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated, CanFinalApprove])
def final_documents_view(request):
<<<<<<< HEAD
=======
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    docs = list_final_documents(request.user)
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, CanFinalApprove])
def final_decision_view(request, id: int):
<<<<<<< HEAD
=======
    if not has_tdr_demande_link_column():
        return _missing_link_response()

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
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
<<<<<<< HEAD
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
=======
@permission_classes([IsAuthenticated, CanAuditeurRead])
def auditeur_documents_view(request):
    if not has_tdr_demande_link_column():
        return _missing_link_response()

    docs = list_auditeur_documents()
    return Response(TdrStDocumentReadSerializer(docs, many=True).data)
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
