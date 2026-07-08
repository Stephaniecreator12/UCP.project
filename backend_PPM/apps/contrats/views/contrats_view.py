from django.core.mail import send_mail

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.contrats.models.enums import ContratStatut
from apps.contrats.models.document import Contrat, DocumentContrat
from apps.contrats.serializers.contrat import ContratSerializer
from apps.contrats.serializers.contrat import ContratCreateUpdateSerializer
from apps.contrats.serializers.upload_serializer import UploadContratSerializer
class ContratViewSet(viewsets.ModelViewSet):

    queryset = (
        Contrat.objects
        .select_related("projet", "prestataire")
        .prefetch_related(
            "documents",
            "echeances",
            "audit_logs"
        )
    )

    def get_serializer_class(self):

        if self.action in ["create", "update", "partial_update"]:
            return ContratCreateUpdateSerializer

        return ContratSerializer

    #################################################################
    # Brouillon
    #################################################################

    @action(detail=True, methods=["post"])
    def sauvegarder_brouillon(self, request, pk=None):

        contrat = self.get_object()

        contrat.statut = ContratStatut.BROUILLON
        contrat.save(update_fields=["statut"])

        return Response(
            {"message": "Contrat enregistré en brouillon."}
        )

    #################################################################
    # Validation
    #################################################################

    @action(detail=True, methods=["post"])
    def valider(self, request, pk=None):

        contrat = self.get_object()

        contrat.statut = ContratStatut.ATTENTE_SIGNATURE
        contrat.save(update_fields=["statut"])

        return Response(
            {"message": "Contrat validé."}
        )

    #################################################################
    # Début exécution
    #################################################################

    @action(detail=True, methods=["post"])
    def executer(self, request, pk=None):

        contrat = self.get_object()

        contrat.statut = ContratStatut.EXECUTION
        contrat.save(update_fields=["statut"])

        return Response(
            {"message": "Contrat en cours d'exécution."}
        )

    #################################################################
    # Terminer
    #################################################################

    @action(detail=True, methods=["post"])
    def terminer(self, request, pk=None):

        contrat = self.get_object()

        contrat.statut = ContratStatut.TERMINE
        contrat.save(update_fields=["statut"])

        return Response(
            {"message": "Contrat terminé."}
        )

    @action(detail=True, methods=["post"])
    def upload_document(self, request, pk=None):

        contrat = self.get_object()

        serializer = UploadContratSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        serializer.save(
            contrat=contrat
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    #################################################################
    # Envoyer au prestataire
    #################################################################

    @action(detail=True, methods=["post"])
    def envoyer_prestataire(self, request, pk=None):

        contrat = self.get_object()

        # exemple
        send_mail(
            subject=f"Contrat {contrat.numero_marche}",
            message="Votre contrat est disponible.",
            from_email=None,
            recipient_list=[contrat.prestataire.email],
        )

        return Response(
            {"message": "Email envoyé."}
        )