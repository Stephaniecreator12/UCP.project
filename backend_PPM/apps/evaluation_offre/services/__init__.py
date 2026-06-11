from .evaluation_service import (
    list_offres_a_evaluer,
    list_dao_offres,
    get_evaluation_detail,
    assigner_evaluateurs,
    sauvegarder_evaluation,
    get_classement_seance,
    soumettre_examen_preliminaire,
    soumettre_evaluation_technique,
    soumettre_evaluation_financiere,
    consolider_decision_finale,
)

all = [
    list_offres_a_evaluer,
    list_dao_offres,
    get_evaluation_detail,
    assigner_evaluateurs,
    sauvegarder_evaluation,
    get_classement_seance,
    soumettre_examen_preliminaire,
    soumettre_evaluation_technique,
    soumettre_evaluation_financiere,
    consolider_decision_finale,
]