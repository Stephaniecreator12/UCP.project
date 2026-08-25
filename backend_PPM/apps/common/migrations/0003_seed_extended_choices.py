from django.db import migrations


SEED_DATA = {
    # --- Achats ---
    "CATEGORIE_BESOIN": [
        ("NOUVEAU_BESOIN", "Nouveau besoin"),
        ("REAPPROVISIONNEMENT", "Réapprovisionnement stock"),
        ("REMPLACEMENT", "Remplacement équipement défectueux"),
        ("URGENCE", "Urgence opérationnelle"),
    ],
    "TYPE_DEMANDE_ACHAT": [
        ("MATERIELS", "Matériels"),
        ("PETITS_SERVICES", "Petits services"),
        ("SERVICES_RECURRENTS", "Services récurrents"),
    ],
    "PRIORITE_ACHAT": [
        ("URGENT", "Urgent"),
        ("NORMAL", "Normal"),
    ],
    "SOURCE_FINANCEMENT_DETAIL": [
        ("SRPS_CS7_FM", "SRPS / CS7 / Fonds Mondial"),
        ("RSS3_GAVI", "RSS3 / Alliance GAVI"),
        ("FAE_GAVI", "FAE / Alliance GAVI"),
        ("CDS_GAVI", "CDS / Alliance GAVI"),
        ("VAR_GAVI", "VAR / Alliance GAVI"),
        ("PARN2_BM", "PARN2 / Banque Mondiale"),
        ("PPSB_BM", "PPSB / Banque Mondiale"),
    ],
    "STATUT_DEMANDE_ACHAT": [
        ("BROUILLON", "Brouillon"),
        ("SOUMISE", "Soumise"),
        ("A_COMPLETER", "À compléter"),
        ("VALIDEE", "Validée"),
        ("VALIDEE_BUDGETAIRE", "Validée budgétairement"),
        ("EN_COMMANDE", "En commande"),
        ("EN_LIVRAISON", "En livraison"),
        ("LIVREE", "Livrée"),
        ("CLOTUREE", "Clôturée"),
        ("REJETEE", "Rejetée"),
    ],
    "ETAPE_VALIDATION_ACHAT": [
        ("HIERARCHIQUE", "Validation hiérarchique"),
        ("TECHNIQUE", "Validation technique"),
        ("BUDGETAIRE", "Validation budgétaire"),
        ("PROGRAMMATIQUE", "Validation programmatique"),
        ("APPROBATION_FINALE", "Approbation finale"),
        ("TERMINEE", "Terminée"),
    ],
    "TYPE_PROCEDURE_ACHAT": [
        ("DEMANDE_COTATION", "Demande de cotation"),
        ("BON_COMMANDE_DIRECT", "Bon de commande direct"),
        ("SELECTION_APRES_COTATION", "Sélection après cotation"),
    ],
    "ETAT_EXPEDITION": [
        ("EN_TRANSIT", "En transit"),
        ("ARRIVE", "Arrivé"),
        ("PARTIEL", "Partiel"),
        ("RETARD", "Retard"),
    ],
    "CONFORMITE_QUANTITE": [
        ("CONFORME", "Conforme"),
        ("NON_CONFORME", "Non conforme"),
        ("PARTIELLE", "Partielle"),
    ],
    "CONFORMITE_QUALITE": [
        ("CONFORME", "Conforme"),
        ("NON_CONFORME", "Non conforme"),
        ("DEFECTUEUX", "Défectueux"),
    ],
    "STATUT_RECEPTION": [
        ("EN_ATTENTE", "En attente"),
        ("RECEPTION_PARTIELLE", "Réception partielle"),
        ("RECEPTION_COMPLETE", "Réception complète"),
        ("ECART_DETECTE", "Écart détecté"),
        ("ECART_RESOLU", "Écart résolu"),
    ],
    "TYPE_ECART": [
        ("MANQUANT", "Manquant"),
        ("DEFECTUEUX", "Défectueux"),
        ("NON_CONFORME", "Non conforme"),
        ("HORS_SPECIFICATIONS", "Hors spécifications"),
    ],
    "ACTION_CORRECTIVE": [
        ("REMPLACEMENT", "Remplacement"),
        ("REPARATION", "Réparation"),
        ("AVOIR", "Avoir"),
        ("REJET", "Rejet"),
    ],
    "STATUT_FINAL_ACHAT": [
        ("CLOTURE", "Clôturé"),
        ("PARTIELLEMENT_EXECUTE", "Partiellement exécuté"),
        ("ANNULE", "Annulé"),
    ],
    "TYPE_DOCUMENT_ACHAT": [
        ("SPECIFICATIONS_TECHNIQUES", "Spécifications techniques détaillées"),
        ("TDR_SIMPLIFIE", "Termes de Reference simplifiés"),
        ("DEVIS_ESTIMATIF", "Devis estimatif"),
        ("BON_SORTIE_STOCK", "Bon de sortie stock"),
        ("BON_LIVRAISON", "Bon de livraison"),
        ("PV_RECEPTION", "Procès-verbal de réception"),
    ],
    "ACTION_HISTORIQUE_ACHAT": [
        ("DEMANDE_CREEE", "Demande créée"),
        ("DEMANDE_SOUMISE", "Demande soumise"),
        ("VALIDATION", "Validation enregistrée"),
        ("BUDGET_VALIDE", "Budget validé"),
        ("COMMANDE_EMISE", "Commande émise"),
        ("LIVRAISON_MISE_A_JOUR", "Livraison mise à jour"),
        ("RECEPTION_ENREGISTREE", "Réception enregistrée"),
        ("ECART_RESOLU", "Écart résolu"),
        ("DEMANDE_CLOTUREE", "Demande clôturée"),
        ("RAPPEL_VALIDATION_24H", "Rappel validation 24h"),
    ],
    "TYPE_SERVICE_ACHAT": [
        ("FORMATION", "Formation"),
        ("MAINTENANCE", "Maintenance"),
        ("REPARATION", "Réparation"),
        ("NETTOYAGE", "Nettoyage"),
        ("PRESTATION_PONCTUELLE", "Prestation ponctuelle"),
    ],
    "DECISION_VALIDATION": [
        ("FAVORABLE", "Favorable"),
        ("DEFAVORABLE", "Défavorable"),
        ("A_COMPLETER", "À compléter"),
        ("APPROUVEE", "Approuvée"),
        ("REJETEE", "Rejetée"),
        ("A_REVOIR", "À revoir"),
    ],
    # --- Contrat ---
    "STATUT_PAIEMENT": [
        ("EN_ATTENTE", "En attente"),
        ("FACTURE_RECUE", "Facture reçue"),
        ("PAYE", "Payé"),
    ],
    "ACTION_AUDIT_CONTRAT": [
        ("CREATE", "Création"),
        ("UPDATE", "Modification"),
        ("UPLOAD", "Dépôt de fichier"),
        ("SEND", "Envoi"),
        ("SIGN", "Signature"),
        ("VALIDATE", "Validation"),
        ("CANCEL", "Annulation"),
    ],
    # --- TDR/ST ---
    "TYPE_DOCUMENT_TDR_ST": [
        ("TDR", "Termes de Reference (TDR)"),
        ("ST", "Spécifications Techniques (ST)"),
    ],
    "STATUT_TDR_ST": [
        ("BROUILLON", "Brouillon"),
        ("SOUMIS", "Soumis"),
        ("EN_VALIDATION", "En validation"),
        ("A_REVOIR", "À revoir"),
        ("EN_ATTENTE_ANO", "En attente ANO"),
        ("VALIDE", "Validé"),
        ("REJETE", "Rejeté"),
        ("SUSPENDU", "Suspendu"),
    ],
    "CATEGORIE_ACTIVITE": [
        ("FORMATION", "Formation"),
        ("ATELIER", "Atelier"),
        ("REUNION", "Réunion"),
        ("REVUE", "Revue"),
        ("SUPERVISION", "Supervision"),
        ("ETUDE", "Étude"),
        ("CONSULTANT", "Consultant"),
        ("CABINET", "Cabinet"),
        ("BUREAU_ETUDES", "Bureau d'études"),
        ("ENTREPRISE", "Entreprise"),
        ("BIENS", "Biens"),
        ("INFRASTRUCTURE", "Infrastructure"),
    ],
    "DUREE_UNITE": [
        ("JOURS", "Jours"),
        ("MOIS", "Mois"),
    ],
    "ETAPE_VALIDATION_TDR_ST": [
        ("DEPOT", "Dépôt"),
        ("VALIDATION_TECHNIQUE", "Validation technique"),
        ("APPROBATION_FINALE", "Approbation finale"),
        ("ANO", "Avis de Non-Objection (ANO)"),
        ("SUSPENSION", "Suspension"),
    ],
    "DECISION_VALIDATION_TDR_ST": [
        ("FAVORABLE", "Favorable"),
        ("A_REVOIR", "À revoir"),
        ("APPROUVE", "Approuvé"),
        ("REJETE", "Rejeté"),
        ("SUSPENDU", "Suspendu"),
        ("ANO_ACCORDE", "ANO accordé"),
        ("ANO_REFUSE", "ANO refusé"),
    ],
    # --- Evaluation ---
    "STATUT_EVALUATION": [
        ("EN_COURS", "En cours"),
        ("CONSENSUS_REQUIS", "Consensus requis"),
        ("COMPLETE", "Complète"),
        ("ELIMINEE", "Éliminée"),
    ],
    "RECOMMANDATION_EVALUATION": [
        ("ATTRIBUER", "Attribuer le marché"),
        ("REJETER", "Rejeter l'offre"),
        ("RELANCER", "Relancer l'appel d'offres"),
    ],
    "DECLARATION_CONFLIT": [
        ("OUI", "Oui - aucun lien avec le soumissionnaire"),
        ("NON", "Non - conflit d'intérêt déclaré"),
    ],
    "STATUT_DAO_EVALUATION": [
        ("A_ASSIGNER", "À assigner"),
        ("EN_EVALUATION", "En évaluation"),
        ("TERMINE", "Terminé"),
    ],
    # --- Ouverture ---
    "STATUT_SEANCE": [
        ("BROUILLON", "Brouillon"),
        ("EN_SAISIE", "En saisie"),
        ("EN_VALIDATION_MEMBRES", "En validation membres"),
        ("EN_VALIDATION_PRESIDENT", "En validation président"),
        ("VALIDEE", "Validée"),
        ("REJETEE", "Rejetée"),
    ],
    "DECISION_SEANCE": [
        ("EN_ATTENTE", "En attente"),
        ("VALIDEE", "Validée"),
        ("REJETEE", "Rejetée"),
        ("REPORTEE", "Reportée"),
    ],
    "ETAPE_OUVERTURE": [
        ("COMPLETE", "Ouverture complète"),
        ("ADMIN_TECH", "Ouverture administrative et technique"),
    ],
    "ETAT_SCELLE": [
        ("INTACT", "Intact"),
        ("ALTERE", "Altéré"),
        ("ABSENT", "Absent"),
    ],
    "ETAT_ENVELOPPE": [
        ("RECU", "Reçu"),
        ("INTEGRE", "Intégré"),
        ("MANQUANT", "Manquant"),
        ("MANQUANTE", "Manquante"),
        ("DEPOSEE", "Déposée"),
    ],
    "DECISION_MEMBRE_SEANCE": [
        ("EN_ATTENTE", "En attente"),
        ("VALIDEE", "Validée"),
        ("REJETEE", "Rejetée"),
    ],
    # --- Users ---
    "TYPE_ENTITE": [
        ("ENTREPRISE", "Entreprise"),
        ("BUREAU_ETUDES", "Bureau d'études"),
        ("ONG", "ONG"),
        ("PARTICULIER", "Particulier"),
        ("CONSULTANT", "Consultant"),
    ],
    "SEXE": [
        ("M", "Masculin"),
        ("F", "Féminin"),
    ],
    # --- Log ---
    "TYPE_LOG_DOCUMENT": [
        ("DAO", "DAO Principal"),
        ("ANNEXE", "Fichier Annexe"),
    ],
}


def seed_choices(apps, schema_editor):
    ReferenceChoice = apps.get_model("common", "ReferenceChoice")
    for group, choices in SEED_DATA.items():
        for sort_order, (code, label) in enumerate(choices):
            ReferenceChoice.objects.update_or_create(
                group=group,
                code=code,
                defaults={"label": label, "sort_order": sort_order, "is_active": True},
            )


def unseed_choices(apps, schema_editor):
    ReferenceChoice = apps.get_model("common", "ReferenceChoice")
    groups = list(SEED_DATA.keys())
    ReferenceChoice.objects.filter(group__in=groups).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0002_seed_default_choices"),
    ]

    operations = [
        migrations.RunPython(seed_choices, unseed_choices),
    ]
