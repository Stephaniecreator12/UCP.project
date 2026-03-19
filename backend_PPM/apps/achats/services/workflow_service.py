#déterminer le prochain statut
 
def get_next_status(current_status, decision):

    if decision == "REJETE":
        return "REJETEE"

    workflow = {
        "SOUMISE": "VALIDE_SERVICE",
        "VALIDE_SERVICE": "VALIDE_BUDGET",
        "VALIDE_BUDGET": "VALIDE_DIRECTION",
    }

    return workflow.get(current_status, current_status)