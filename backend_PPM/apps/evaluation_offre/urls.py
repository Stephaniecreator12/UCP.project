from django.urls import path
from apps.evaluation_offre.views import (
    evaluation_list,
    evaluation_detail,
    evaluation_access,
    assignation_list,
    assigner_evaluateurs_view,
    assigner_evaluateurs_seance_view,
    soumettre_examen_view,
    soumettre_technique_view,
    soumettre_financiere_view,
    consolider_decision_view,
    dao_offres_list,
    dao_dashboard_view,
    dao_detail_view,
    classement_view,
    sauvegarder_evaluation_view,
    login_evaluateur_dao_view,
    renvoyer_invitations_evaluateurs_seance_view,
    verify_evaluateur_password_view,
)

urlpatterns = [
    path("", evaluation_list, name="evaluation-list"),
    path("assignations/", assignation_list, name="evaluation-assignations"),
    path("auth/login/", login_evaluateur_dao_view, name="evaluation-auth-login"),
    path("auth/verify/", verify_evaluateur_password_view, name="evaluation-auth-verify"),
    path("dao/dashboard/", dao_dashboard_view, name="evaluation-dao-dashboard"),
    path("dao/<int:seance_id>/offres/", dao_offres_list, name="evaluation-dao-offres"),
    path("dao/<int:seance_id>/detail/", dao_detail_view, name="evaluation-dao-detail"),
    path("dao/<int:seance_id>/classement/", classement_view, name="evaluation-classement"),
    path("dao/<int:seance_id>/assigner/", assigner_evaluateurs_seance_view, name="evaluation-dao-assigner"),
    path("dao/<int:seance_id>/renvoyer-invitations/", renvoyer_invitations_evaluateurs_seance_view, name="evaluation-dao-renvoyer-invitations"),

    # Détail complet d'une évaluation
    path("<int:offre_id>/", evaluation_detail, name="evaluation-detail"),

    # Sauvegarde unifiée du formulaire
    path("<int:offre_id>/save/", sauvegarder_evaluation_view, name="evaluation-save"),

    # Accès par email + code (pour évaluateurs sans compte)
    path("<int:offre_id>/access/", evaluation_access, name="evaluation-access"),

    # Assigner 3 évaluateurs à une offre
    path("<int:offre_id>/assigner/", assigner_evaluateurs_view, name="evaluation-assigner"),

    # Section 2 : examen préliminaire
    path("<int:offre_id>/examen-preliminaire/", soumettre_examen_view, name="evaluation-examen"),

    # Section 3 : évaluation technique
    path("<int:offre_id>/technique/", soumettre_technique_view, name="evaluation-technique"),

    # Section 4 : évaluation financière (double aveugle)
    path("<int:offre_id>/financiere/", soumettre_financiere_view, name="evaluation-financiere"),

    # Consolidation finale + recommandation
    path("<int:offre_id>/consolider/", consolider_decision_view, name="evaluation-consolider"),
]
