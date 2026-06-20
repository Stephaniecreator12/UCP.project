from rest_framework.routers import DefaultRouter

from apps.evaluations.views.evaluation_view import (
    AuditTrailViewSet,
    CritereTechniqueViewSet,
    EvaluateurViewSet,
    EvaluationConfigViewSet,
    EvaluationDecisionViewSet,
    EvaluationFinanciereViewSet,
    EvaluationHeaderViewSet,
    EvaluationTechniqueViewSet,
    ExamenPreliminaireViewSet,
    ScoreConsolideViewSet,
    SoumissionnaireViewSet,
)

router = DefaultRouter()
router.register("soumissionnaires", SoumissionnaireViewSet, basename="soumissionnaire")
router.register("configs", EvaluationConfigViewSet, basename="evaluation-config")
router.register("criteres-techniques", CritereTechniqueViewSet, basename="critere-technique")
router.register("evaluations", EvaluationHeaderViewSet, basename="evaluation-header")
router.register("examens-preliminaires", ExamenPreliminaireViewSet, basename="examen-preliminaire")
router.register("evaluateurs", EvaluateurViewSet, basename="evaluateur")
router.register("notes-techniques", EvaluationTechniqueViewSet, basename="evaluation-technique")
router.register("evaluations-financieres", EvaluationFinanciereViewSet, basename="evaluation-financiere")
router.register("scores-consolides", ScoreConsolideViewSet, basename="score-consolide")
router.register("decisions", EvaluationDecisionViewSet, basename="evaluation-decision")
router.register("audit-trail", AuditTrailViewSet, basename="audit-trail")

urlpatterns = router.urls