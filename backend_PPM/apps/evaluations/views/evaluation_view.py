from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.evaluations.utils.mixins import AuditedModelMixin
from apps.evaluations.models.evaluation import (
    AuditTrail,
    CritereTechnique,
    Evaluateur,
    EvaluationConfig,
    EvaluationDecision,
    EvaluationFinanciere,
    EvaluationHeader,
    EvaluationTechnique,
    ExamenPreliminaire,
    ScoreConsolide,
    Soumissionnaire,
)
from apps.evaluations.permissions import IsExternalRHUser
from apps.evaluations.serializers.evaluation_serializer import (
    AuditTrailSerializer,
    CritereTechniqueSerializer,
    EvaluateurSerializer,
    EvaluationConfigSerializer,
    EvaluationDecisionSerializer,
    EvaluationFinanciereSerializer,
    EvaluationHeaderDetailSerializer,
    EvaluationHeaderSerializer,
    EvaluationTechniqueSerializer,
    ExamenPreliminaireSerializer,
    ScoreConsolideSerializer,
    SoumissionnaireSerializer,
)


class BaseExternalViewSet(viewsets.ModelViewSet):
    """Base commune : accès réservé aux utilisateurs RH externes."""

    permission_classes = [IsExternalRHUser]


class SoumissionnaireViewSet(BaseExternalViewSet):
    queryset = Soumissionnaire.objects.all()
    serializer_class = SoumissionnaireSerializer
    search_fields = ["nom", "nif_stat"]


class EvaluationConfigViewSet(BaseExternalViewSet):
    queryset = EvaluationConfig.objects.select_related("marche").all()
    serializer_class = EvaluationConfigSerializer
    filterset_fields = ["marche"]


class CritereTechniqueViewSet(BaseExternalViewSet):
    queryset = CritereTechnique.objects.all()
    serializer_class = CritereTechniqueSerializer
    filterset_fields = ["marche", "actif"]




class EvaluationHeaderViewSet(AuditedModelMixin, BaseExternalViewSet):
    queryset = EvaluationHeader.objects.select_related(
        "marche", "soumissionnaire"
    ).all()
    serializer_class = EvaluationHeaderSerializer
    filterset_fields = ["marche", "soumissionnaire", "statut"]

    actor_id_field = "cree_par_external_id"
    actor_label_field = "cree_par_label"
    set_actor_on_update = False  # le "créateur" ne change jamais après coup

    def get_serializer_class(self):
        if self.action == "retrieve" or self.action == "dossier":
            return EvaluationHeaderDetailSerializer
        return EvaluationHeaderSerializer

    @action(detail=True, methods=["get"])
    def dossier(self, request, pk=None):
        """Vue complète d'une évaluation : examen, évaluateurs, financier, score, décision."""
        instance = self.get_object()
        serializer = EvaluationHeaderDetailSerializer(instance, context={"request": request})
        return Response(serializer.data)


class ExamenPreliminaireViewSet(AuditedModelMixin, BaseExternalViewSet):
    queryset = ExamenPreliminaire.objects.select_related("evaluation").all()
    serializer_class = ExamenPreliminaireSerializer
    filterset_fields = ["evaluation"]

    actor_id_field = "evalue_par_external_id"
    actor_label_field = "evalue_par_label"
    extra_timestamp_field = "evalue_le"
    set_actor_on_update = True


class EvaluationTechniqueViewSet(AuditedModelMixin, BaseExternalViewSet):
    queryset = EvaluationTechnique.objects.select_related(
        "evaluation", "evaluateur", "critere"
    ).all()
    serializer_class = EvaluationTechniqueSerializer
    filterset_fields = ["evaluation", "evaluateur", "critere"]



class EvaluationFinanciereViewSet(AuditedModelMixin, BaseExternalViewSet):
    queryset = EvaluationFinanciere.objects.select_related("evaluation").all()
    serializer_class = EvaluationFinanciereSerializer
    filterset_fields = ["evaluation"]

    actor_id_field = "saisi_par_external_id"
    actor_label_field = "saisi_par_label"
    set_actor_on_update = True


class EvaluationDecisionViewSet(
    AuditedModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    Une décision est définitive (verbe métier 'Conclure') : pas
    d'update ni de delete exposés une fois créée.
    """

    queryset = EvaluationDecision.objects.select_related("evaluation").all()
    serializer_class = EvaluationDecisionSerializer
    permission_classes = [IsExternalRHUser]
    filterset_fields = ["evaluation", "recommandation"]

    actor_id_field = "decide_par_external_id"
    actor_label_field = "decide_par_label"
    set_actor_on_update = False



class EvaluateurViewSet(BaseExternalViewSet):
    queryset = Evaluateur.objects.select_related("evaluation").all()
    serializer_class = EvaluateurSerializer
    filterset_fields = ["evaluation", "role"]

    @action(detail=True, methods=["post"], url_path="valider-score-technique")
    def valider_score_technique(self, request, pk=None):
        """
        Confirmation explicite de l'évaluateur : recalcule son score
        technique total puis active le drapeau de validation. Déclenche
        ensuite la vérification de consensus (écart éval1/éval2).
        """
        evaluateur = self.get_object()
        evaluateur.recalculer_score_technique()
        evaluateur.a_valide_score_technique = True
        evaluateur.save(update_fields=["a_valide_score_technique"])
        evaluateur.evaluation.verifier_consensus()
        evaluateur.refresh_from_db()
        return Response(self.get_serializer(evaluateur).data)


# ---------------------------------------------------------------------------
# Score consolidé : déclenché manuellement après saisie technique/financière
# ---------------------------------------------------------------------------

class ScoreConsolideViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    queryset = ScoreConsolide.objects.select_related(
        "evaluation__marche", "evaluation__soumissionnaire"
    ).all()
    serializer_class = ScoreConsolideSerializer
    permission_classes = [IsExternalRHUser]
    filterset_fields = ["evaluation__marche"]

    @action(detail=True, methods=["post"])
    def consolider(self, request, pk=None):
        """Recalcule le score total de cette évaluation puis le classement de l'AO."""
        score = self.get_object()
        score.consolider()
        ScoreConsolide.recalculer_classement(score.evaluation.marche)
        score.refresh_from_db()
        return Response(self.get_serializer(score).data)


# ---------------------------------------------------------------------------
# Piste d'audit : lecture seule
# ---------------------------------------------------------------------------

class AuditTrailViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = AuditTrail.objects.select_related("content_type").all()
    serializer_class = AuditTrailSerializer
    permission_classes = [IsExternalRHUser]

    def get_queryset(self):
        qs = super().get_queryset()
        content_type = self.request.query_params.get("content_type")
        object_id = self.request.query_params.get("object_id")
        if content_type:
            qs = qs.filter(content_type__model=content_type)
        if object_id:
            qs = qs.filter(object_id=object_id)
        return qs