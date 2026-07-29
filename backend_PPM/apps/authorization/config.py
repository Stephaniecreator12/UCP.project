
GROUP_DEFINITIONS = [
    {
        "name": "PUBLIC",
        "category": "public",
        "description": "Utilisateur externe (fournisseur, consultant). Consultation des avis de marché publics.",
        "permissions": {
            "procurement": {
                "procurementmarket": ["view"],
                "technicaldocument": ["view"],
                "annexdocument": ["view"],
                "dateatelier": ["view"],
            },
            "log": {
                "logconsultation": ["add"],
                "logdownload": ["add"],
            },
        },
    },
    {
        "name": "DEMANDEUR",
        "category": "demandeur",
        "description": "Agent interne pouvant créer et suivre des demandes d'achat.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "add", "change"],
                "lignebesoin": ["view", "add", "change"],
                "documentdemande": ["view", "add", "change"],
                "fournisseur": ["view", "add"],
                "historiquedemande": ["view"],
            },
            "users": {
                "userprofile": ["view"],
            },
        },
    },
    {
        "name": "VALIDATEUR_HIERARCHIQUE",
        "category": "validateur",
        "description": "Validation hiérarchique (étape 1) des demandes d'achat.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "change"],
                "validationdemande": ["view", "add"],
                "historiquedemande": ["view"],
            },
        },
    },
    {
        "name": "VALIDATEUR_TECHNIQUE",
        "category": "validateur",
        "description": "Validation technique (étape 2) des demandes d'achat. Gestion et validation des documents TDR.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "change"],
                "validationdemande": ["view", "add"],
                "historiquedemande": ["view"],
            },
            "TdrSt": {
                "tdrstdocument": ["view", "add", "change"],
                "tdrstdocumentfileversion": ["view", "add"],
                "tdrstvalidationaction": ["view", "add"],
            },
        },
    },
    {
        "name": "VALIDATEUR_PROGRAMMATIQUE",
        "category": "validateur",
        "description": "Validation programmatique (étape 3) des demandes d'achat.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "change"],
                "validationdemande": ["view", "add"],
                "historiquedemande": ["view"],
            },
        },
    },
    {
        "name": "APPROBATEUR_NATIONAL",
        "category": "validateur",
        "description": "Approbation finale (étape 4) des demandes d'achat. Approbation finale des documents TDR.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "change"],
                "validationdemande": ["view", "add"],
                "historiquedemande": ["view"],
            },
            "TdrSt": {
                "tdrstdocument": ["view", "change"],
                "tdrstvalidationaction": ["view", "add"],
            },
        },
    },
    {
        "name": "FINANCE",
        "category": "finance",
        "description": "Service finance – validation budgétaire des demandes d'achat.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "change"],
                "validationdemande": ["view", "add"],
                "historiquedemande": ["view"],
            },
        },
    },
    {
        "name": "RAF",
        "category": "finance",
        "description": "Responsable Administratif et Financier – validation budgétaire.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "change"],
                "validationdemande": ["view", "add"],
                "historiquedemande": ["view"],
            },
        },
    },
    {
        "name": "VALIDATEUR_BUDGETAIRE",
        "category": "finance",
        "description": "Validation budgétaire des demandes d'achat.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "change"],
                "validationdemande": ["view", "add"],
                "historiquedemande": ["view"],
            },
        },
    },
    {
        "name": "AGENT_ACHAT",
        "category": "achat",
        "description": "Agent passation – gestion des marchés et passation des contrats.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "add", "change"],
                "lignebesoin": ["view", "add", "change"],
                "documentdemande": ["view", "add", "change"],
                "fournisseur": ["view", "add", "change"],
                "historiquedemande": ["view"],
            },
            "procurement": {
                "procurementmarket": ["view", "add", "change"],
                "technicaldocument": ["view", "add", "change"],
                "annexdocument": ["view", "add", "change"],
            },
            "users": {
                "userprofile": ["view"],
            },
        },
    },
    {
        "name": "LOGISTIQUE",
        "category": "marche",
        "description": "Agent logistique – suivi des marchés et réception des biens/services.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "change"],
                "documentdemande": ["view", "add"],
                "historiquedemande": ["view"],
            },
            "procurement": {
                "procurementmarket": ["view", "change"],
                "technicaldocument": ["view", "add"],
                "annexdocument": ["view", "add"],
            },
            "users": {
                "userprofile": ["view"],
            },
        },
    },
    {
        "name": "AGENT_MARCHE",
        "category": "marche",
        "description": "Agent marché – gestion opérationnelle des marchés.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "change"],
                "documentdemande": ["view", "add"],
                "historiquedemande": ["view"],
            },
            "procurement": {
                "procurementmarket": ["view", "add", "change"],
                "technicaldocument": ["view", "add", "change"],
                "annexdocument": ["view", "add", "change"],
            },
            "users": {
                "userprofile": ["view"],
            },
        },
    },
    {
        "name": "MARCHES",
        "category": "marche",
        "description": "Service marché – supervision des processus de marché.",
        "permissions": {
            "achats": {
                "demandeachat": ["view", "change"],
                "documentdemande": ["view", "add"],
                "historiquedemande": ["view"],
            },
            "procurement": {
                "procurementmarket": ["view", "add", "change"],
                "technicaldocument": ["view", "add", "change"],
                "annexdocument": ["view", "add", "change"],
                "dateatelier": ["view", "add", "change"],
            },
            "users": {
                "userprofile": ["view"],
            },
        },
    },
    {
        "name": "SECRETAIRE",
        "category": "ouverture_offre",
        "description": "Secrétaire de séance – gestion des séances d'ouverture des offres.",
        "permissions": {
            "ouverture_offre": {
                "seanceouverture": ["view", "add", "change"],
                "offreouverture": ["view", "add", "change"],
                "membreseance": ["view", "add", "change"],
                "pvdocument": ["view", "add", "change"],
            },
            "evaluation_offre": {
                "evaluationseanceassignation": ["view"],
                "evaluationoffre": ["view"],
            },
            "contractualisation": {
                "contrat": ["view"],
            },
        },
    },
    {
        "name": "SECRETAIRE_CONTRACTUALISATION",
        "category": "contractualisation",
        "description": "Secrétaire contractualisation – gestion des contrats et échéanciers.",
        "permissions": {
            "contractualisation": {
                "contrat": ["view", "add", "change"],
                "echeancierpaiement": ["view", "add", "change"],
                "documentcontrat": ["view", "add", "change"],
                "audittrailcontrat": ["view"],
            },
            "achats": {
                "demandeachat": ["view"],
            },
        },
    },
    {
        "name": "AUDITEUR",
        "category": "audit",
        "description": "Auditeur – consultation en lecture seule des documents TDR et évaluations.",
        "permissions": {
            "TdrSt": {
                "tdrstdocument": ["view"],
                "tdrstdocumentfileversion": ["view"],
                "tdrstvalidationaction": ["view"],
            },
            "evaluation_offre": {
                "evaluationoffre": ["view"],
                "examenpreliminaire": ["view"],
                "evaluationtechnique": ["view"],
                "evaluationfinanciere": ["view"],
                "audittrail": ["view"],
            },
        },
    },
    {
        "name": "EVALUATEUR",
        "category": "evaluation",
        "description": "Évaluateur – membre de la commission d'évaluation des offres.",
        "permissions": {
            "evaluation_offre": {
                "evaluationseanceassignation": ["view"],
                "evaluationoffre": ["view", "change"],
                "examenpreliminaire": ["view", "add", "change"],
                "evaluationtechnique": ["view", "add", "change"],
                "evaluationfinanciere": ["view", "add", "change"],
                "evaluationconclusion": ["view", "add", "change"],
                "evaluationreport": ["view"],
            },
        },
    },
    {
        "name": "PRESIDENT",
        "category": "evaluation",
        "description": "Président de la commission d'évaluation – supervision et décision finale.",
        "permissions": {
            "evaluation_offre": {
                "evaluationseanceassignation": ["view", "add", "change"],
                "evaluationoffre": ["view", "change"],
                "examenpreliminaire": ["view", "change"],
                "evaluationtechnique": ["view", "change"],
                "evaluationfinanciere": ["view", "change"],
                "evaluationconclusion": ["view", "change"],
                "decisionfinale": ["view", "add", "change"],
                "audittrail": ["view"],
                "evaluationreport": ["view", "add", "change"],
            },
        },
    },
]

CATEGORIES = {
    "public": "Utilisateurs publics",
    "demandeur": "Demandeurs",
    "validateur": "Validateurs / Approbateurs",
    "finance": "Finance / Budget",
    "achat": "Agents d'achat / Passation",
    "marche": "Agents de marché / Logistique",
    "ouverture_offre": "Ouverture des offres",
    "contractualisation": "Contractualisation",
    "evaluation": "Évaluation des offres",
    "audit": "Audit",
}

def get_group_names():
    return [g["name"] for g in GROUP_DEFINITIONS]

def get_groups_by_category(category):
    return [g for g in GROUP_DEFINITIONS if g["category"] == category]
