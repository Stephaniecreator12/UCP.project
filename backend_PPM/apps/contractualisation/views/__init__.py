from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import FileResponse
from django.shortcuts import get_object_or_404

from ..models import Contrat
from ..permissions import IsSecretaireContractualisation
from ..serializers import (
    ContratListSerializer,
    ContratDetailSerializer,
    ContratCreateSerializer,
    ContratUpdateSerializer,
    EcheancierCreateSerializer,
)
from ..services import (
    creer_contrat_brouillon,
    mettre_a_jour_contrat,
    ajouter_echeancier,
    upload_document_contrat,
    envoyer_contrat_prestataire,
    get_contrat_detail,
)


# ============================================================
# LISTE DES CONTRATS
# ============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsSecretaireContractualisation])
def contrats_list(request):
    """
    GET /api/contrats/
    Retourne la liste de tous les contrats
    """
    contrats = Contrat.objects.all().order_by("-created_at")
    serializer = ContratListSerializer(contrats, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================
# CRÉER UN CONTRAT (À PARTIR DU RANG 1)
# ============================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSecretaireContractualisation])
def contrats_create(request):
    """
    POST /api/contrats/create/
    Body: { seance_id: int, offre_id: int }
    """
    serializer = ContratCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        contrat = creer_contrat_brouillon(
            seance_id=serializer.validated_data["seance_id"],
            offre_id=serializer.validated_data["offre_id"],
            utilisateur=request.user,
            ip_adresse=request.META.get("REMOTE_ADDR", ""),
            navigateur=request.META.get("HTTP_USER_AGENT", "")[:255],
        )
        return Response(
            ContratDetailSerializer(contrat).data,
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# DÉTAIL D'UN CONTRAT
# ============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsSecretaireContractualisation])
def contrats_detail(request, contrat_id: int):
    """
    GET /api/contrats/<id>/
    """
    contrat = get_object_or_404(Contrat, id=contrat_id)
    serializer = ContratDetailSerializer(contrat)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================
# METTRE À JOUR UN CONTRAT
# ============================================================
@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsSecretaireContractualisation])
def contrats_update(request, contrat_id: int):
    """
    PATCH /api/contrats/<id>/
    Body: { email_prestataire, telephone, clauses, ... }
    """
    serializer = ContratUpdateSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    try:
        contrat = mettre_a_jour_contrat(
            contrat_id=contrat_id,
            donnees=serializer.validated_data,
            utilisateur=request.user,
            ip_adresse=request.META.get("REMOTE_ADDR", ""),
            navigateur=request.META.get("HTTP_USER_AGENT", "")[:255],
        )
        return Response(
            ContratDetailSerializer(contrat).data,
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# AJOUTER UN ÉCHÉANCIER
# ============================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSecretaireContractualisation])
def echeancier_add(request, contrat_id: int):
    """
    POST /api/contrats/<id>/echeancier/
    Body: { montant, pourcentage, etape, date_prevue }
    """
    serializer = EcheancierCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        ligne = ajouter_echeancier(
            contrat_id=contrat_id,
            montant=serializer.validated_data["montant"],
            pourcentage=serializer.validated_data["pourcentage"],
            etape=serializer.validated_data["etape"],
            date_prevue=serializer.validated_data["date_prevue"],
            utilisateur=request.user,
        )
        return Response(
            {
                "id": ligne.id,
                "montant": str(ligne.montant),
                "pourcentage": ligne.pourcentage,
                "etape": ligne.etape,
                "date_prevue": ligne.date_prevue,
                "statut": ligne.statut,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# MODIFIER / SUPPRIMER UN ÉCHÉANCIER
# ============================================================
@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated, IsSecretaireContractualisation])
def echeancier_detail(request, contrat_id: int, echeancier_id: int):
    """
    PATCH /api/contrats/<id>/echeancier/<echeancier_id>/
    DELETE /api/contrats/<id>/echeancier/<echeancier_id>/
    """
    from .models import EcheancierPaiement
    
    contrat = get_object_or_404(Contrat, id=contrat_id)
    ligne = get_object_or_404(EcheancierPaiement, id=echeancier_id, contrat=contrat)

    if request.method == "PATCH":
        # Update the echéancier line
        serializer = EcheancierCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        if "montant" in serializer.validated_data:
            ligne.montant = serializer.validated_data["montant"]
        if "pourcentage" in serializer.validated_data:
            ligne.pourcentage = serializer.validated_data["pourcentage"]
        if "etape" in serializer.validated_data:
            ligne.etape = serializer.validated_data["etape"]
        if "date_prevue" in serializer.validated_data:
            ligne.date_prevue = serializer.validated_data["date_prevue"]
        
        ligne.save()
        return Response(
            {
                "id": ligne.id,
                "montant": str(ligne.montant),
                "pourcentage": ligne.pourcentage,
                "etape": ligne.etape,
                "date_prevue": ligne.date_prevue,
                "statut": ligne.statut,
            },
            status=status.HTTP_200_OK,
        )

    elif request.method == "DELETE":
        ligne.delete()
        return Response(
            {"detail": f"Ligne d'échéancier supprimée"},
            status=status.HTTP_204_NO_CONTENT,
        )


# ============================================================
# UPLOAD DOCUMENT PDF
# ============================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSecretaireContractualisation])
def document_upload(request, contrat_id: int):
    """
    POST /api/contrats/<id>/upload/
    Form-data: { fichier: File }
    """
    if "fichier" not in request.FILES:
        return Response(
            {"detail": "Fichier PDF requis"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        document = upload_document_contrat(
            contrat_id=contrat_id,
            fichier=request.FILES["fichier"],
            utilisateur=request.user,
            ip_adresse=request.META.get("REMOTE_ADDR", ""),
            navigateur=request.META.get("HTTP_USER_AGENT", "")[:255],
        )
        return Response(
            {
                "id": document.id,
                "type": document.type_document,
                "fichier": document.fichier.url,
                "hash_sha256": document.hash_sha256,
                "date_upload": document.date_upload,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# ENVOYER LE CONTRAT AU PRESTATAIRE
# ============================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSecretaireContractualisation])
def contrats_send(request, contrat_id: int):
    """
    POST /api/contrats/<id>/send/
    Envoie le contrat au prestataire + change statut ATTENTE_SIGNATURE
    """
    try:
        result = envoyer_contrat_prestataire(
            contrat_id=contrat_id,
            utilisateur=request.user,
            ip_adresse=request.META.get("REMOTE_ADDR", ""),
            navigateur=request.META.get("HTTP_USER_AGENT", "")[:255],
        )
        contrat = Contrat.objects.get(id=contrat_id)
        return Response(
            {
                "detail": result["message"],
                "contrat": ContratDetailSerializer(contrat).data,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# TÉLÉCHARGER UN DOCUMENT
# ============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsSecretaireContractualisation])
def document_download(request, contrat_id: int, document_id: int):
    """
    GET /api/contrats/<id>/documents/<doc_id>/download/
    """
    from ..models import DocumentContrat

    contrat = get_object_or_404(Contrat, id=contrat_id)
    document = get_object_or_404(DocumentContrat, id=document_id, contrat=contrat)

    if not document.fichier:
        return Response(
            {"detail": "Fichier non trouvé"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return FileResponse(
        document.fichier.open("rb"),
        as_attachment=False,
        filename=f"{contrat.numero_marche}_signe.pdf",
        content_type="application/pdf",
    )
