
GROUP_DEFINITIONS = [
    {
        "name": "ADMIN",
        "category": "admin",
        "description": "Administrateur système – accès complet à tous les modules et fonctionnalités.",
        "permissions": {
            "users": {
                "userprofile": ["view", "add", "change", "delete"],
                "programme": ["view", "add", "change", "delete"],
                "poste": ["view", "add", "change", "delete"],
                "agentprofile": ["view", "add", "change", "delete"],
            },
            "ppm": {
                "travaux": ["view", "add", "change", "delete"],
                "biens": ["view", "add", "change", "delete"],
                "consultance": ["view", "add", "change", "delete"],
            },
            "achats": {
                "demandeachat": ["view", "add", "change", "delete"],
                "historiquedemande": ["view", "add", "change", "delete"],
                "lignebesoin": ["view", "add", "change", "delete"],
                "documentdemande": ["view", "add", "change", "delete"],
                "validationdemande": ["view", "add", "change", "delete"],
                "fournisseur": ["view", "add", "change", "delete"],
            },
            "TdrSt": {
                "tdrstdocument": ["view", "add", "change", "delete"],
                "tdrstdocumentfileversion": ["view", "add", "change", "delete"],
                "tdrstvalidationaction": ["view", "add", "change", "delete"],
            },
            "procurement": {
                "procurementmarket": ["view", "add", "change", "delete"],
                "technicaldocument": ["view", "add", "change", "delete"],
                "annexdocument": ["view", "add", "change", "delete"],
                "dateatelier": ["view", "add", "change", "delete"],
            },
            "ouverture_offre": {
                "seanceouverture": ["view", "add", "change", "delete"],
                "offreouverture": ["view", "add", "change", "delete"],
                "membreseance": ["view", "add", "change", "delete"],
                "pvdocument": ["view", "add", "change", "delete"],
            },
            "evaluation_offre": {
                "evaluationseanceassignation": ["view", "add", "change", "delete"],
                "evaluationoffre": ["view", "add", "change", "delete"],
                "examenpreliminaire": ["view", "add", "change", "delete"],
                "evaluationtechnique": ["view", "add", "change", "delete"],
                "evaluationfinanciere": ["view", "add", "change", "delete"],
                "evaluationconclusion": ["view", "add", "change", "delete"],
                "decisionfinale": ["view", "add", "change", "delete"],
                "audittrail": ["view", "add", "change", "delete"],
                "evaluationreport": ["view", "add", "change", "delete"],
            },
            "contractualisation": {
                "contrat": ["view", "add", "change", "delete"],
                "echeancierpaiement": ["view", "add", "change", "delete"],
                "documentcontrat": ["view", "add", "change", "delete"],
                "audittrailcontrat": ["view", "add", "change", "delete"],
            },
            "log": {
                "logconsultation": ["view", "add", "change", "delete"],
                "logdownload": ["view", "add", "change", "delete"],
            },
        },
    },
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
                "dateatelier": ["view", "add", "change"],
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
                "dateatelier": ["view", "add"],
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
                "dateatelier": ["view", "add", "change"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
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
            "procurement": {
                            "procurementmarket": ["view"],
                            "technicaldocument": ["view"],
                            "annexdocument": ["view"],
                            "dateatelier": ["view"],
            },
        },
    },
]

CATEGORIES = {
    "admin": "Administrateur",
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
