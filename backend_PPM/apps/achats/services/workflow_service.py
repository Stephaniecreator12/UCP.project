def get_next_step(statut):

    workflow = {
        "BROUILLON": "CHEF_SERVICE",
        "CHEF_SERVICE": "DIRECTION",
        "DIRECTION": "PASSATION_MARCHE",
    }

    return workflow.get(statut)