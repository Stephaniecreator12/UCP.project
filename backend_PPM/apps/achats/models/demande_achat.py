from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class DemandeAchat(models.Model):
    CATEGORIE_NOUVEAU_BESOIN = "NOUVEAU_BESOIN"
    CATEGORIE_REAPPROVISIONNEMENT = "REAPPROVISIONNEMENT"
    CATEGORIE_REMPLACEMENT = "REMPLACEMENT"
    CATEGORIE_URGENCE = "URGENCE"

    CATEGORIE_CHOICES = [
        (CATEGORIE_NOUVEAU_BESOIN, "Nouveau besoin"),
        (CATEGORIE_REAPPROVISIONNEMENT, "Reapprovisionnement stock"),
        (CATEGORIE_REMPLACEMENT, "Remplacement equipement defectueux"),
        (CATEGORIE_URGENCE, "Urgence operationnelle"),
    ]

    TYPE_MATERIELS = "MATERIELS"
    TYPE_PETITS_SERVICES = "PETITS_SERVICES"
    TYPE_SERVICES_RECURRENTS = "SERVICES_RECURRENTS"

    TYPE_DEMANDE_CHOICES = [
        (TYPE_MATERIELS, "Materiels"),
        (TYPE_PETITS_SERVICES, "Petits services"),
        (TYPE_SERVICES_RECURRENTS, "Services recurrents"),
    ]

    PRIORITE_URGENT = "URGENT"
    PRIORITE_NORMAL = "NORMAL"

    PRIORITE_CHOICES = [
        (PRIORITE_URGENT, "Urgent"),
        (PRIORITE_NORMAL, "Normal"),
    ]

    SOURCE_FONDS_MONDIAL = "FONDS_MONDIAL"
    SOURCE_BANQUE_MONDIALE = "BANQUE_MONDIALE"
    SOURCE_GAVI = "GAVI"

    SOURCE_FINANCEMENT_CHOICES = [
        (SOURCE_FONDS_MONDIAL, "Fonds mondial"),
        (SOURCE_BANQUE_MONDIALE, "Banque mondiale"),
        (SOURCE_GAVI, "Alliance Gavi"),
    ]

    STATUT_BROUILLON = "BROUILLON"
    STATUT_SOUMISE = "SOUMISE"
    STATUT_A_COMPLETER = "A_COMPLETER"
    STATUT_VALIDEE = "VALIDEE"
    STATUT_EN_COMMANDE = "EN_COMMANDE"
    STATUT_EN_LIVRAISON = "EN_LIVRAISON"
    STATUT_LIVREE = "LIVREE"
    STATUT_CLOTUREE = "CLOTUREE"
    STATUT_REJETEE = "REJETEE"

    STATUT_CHOICES = [
        (STATUT_BROUILLON, "Brouillon"),
        (STATUT_SOUMISE, "Soumise"),
        (STATUT_A_COMPLETER, "A completer"),
        (STATUT_VALIDEE, "Validee"),
        (STATUT_EN_COMMANDE, "En commande"),
        (STATUT_EN_LIVRAISON, "En livraison"),
        (STATUT_LIVREE, "Livree"),
        (STATUT_CLOTUREE, "Cloturee"),
        (STATUT_REJETEE, "Rejetee"),
    ]
    
    ETAPE_HIERARCHIQUE = "HIERARCHIQUE"
    ETAPE_TECHNIQUE = "TECHNIQUE"
    ETAPE_BUDGETAIRE = "BUDGETAIRE"
    ETAPE_PROGRAMMATIQUE = "PROGRAMMATIQUE"
    ETAPE_APPROBATION_FINALE = "APPROBATION_FINALE"
    ETAPE_TERMINEE = "TERMINEE"

    ETAPE_VALIDATION_CHOICES = [
        (ETAPE_HIERARCHIQUE, "Validation hierarchique"),
        (ETAPE_TECHNIQUE, "Validation technique"),
        (ETAPE_BUDGETAIRE, "Validation budgetaire"),
        (ETAPE_PROGRAMMATIQUE, "Validation programmatique"),
        (ETAPE_APPROBATION_FINALE, "Approbation finale"),
        (ETAPE_TERMINEE, "Terminee"),
    ]

    PROCEDURE_COTATION = "DEMANDE_COTATION"
    PROCEDURE_BON_DIRECT = "BON_COMMANDE_DIRECT"
    PROCEDURE_SELECTION_APRES_COTATION = "SELECTION_APRES_COTATION"

    TYPE_PROCEDURE_CHOICES = [
        (PROCEDURE_COTATION, "Demande de cotation"),
        (PROCEDURE_BON_DIRECT, "Bon de commande direct"),
        (PROCEDURE_SELECTION_APRES_COTATION, "Selection apres cotation"),
    ]

    ETAT_EXPEDITION_TRANSIT = "EN_TRANSIT"
    ETAT_EXPEDITION_ARRIVE = "ARRIVE"
    ETAT_EXPEDITION_PARTIEL = "PARTIEL"
    ETAT_EXPEDITION_RETARD = "RETARD"

    ETAT_EXPEDITION_CHOICES = [
        (ETAT_EXPEDITION_TRANSIT, "En transit"),
        (ETAT_EXPEDITION_ARRIVE, "Arrive"),
        (ETAT_EXPEDITION_PARTIEL, "Partiel"),
        (ETAT_EXPEDITION_RETARD, "Retard"),
    ]

    CONFORMITE_CONFORME = "CONFORME"
    CONFORMITE_NON_CONFORME = "NON_CONFORME"
    CONFORMITE_PARTIELLE = "PARTIELLE"
    CONFORMITE_DEFECTUEUX = "DEFECTUEUX"

    CONFORMITE_QUANTITE_CHOICES = [
        (CONFORMITE_CONFORME, "Conforme"),
        (CONFORMITE_NON_CONFORME, "Non conforme"),
        (CONFORMITE_PARTIELLE, "Partielle"),
    ]

    CONFORMITE_QUALITE_CHOICES = [
        (CONFORMITE_CONFORME, "Conforme"),
        (CONFORMITE_NON_CONFORME, "Non conforme"),
        (CONFORMITE_DEFECTUEUX, "Defectueux"),
    ]

    STATUT_RECEPTION_EN_ATTENTE = "EN_ATTENTE"
    STATUT_RECEPTION_PARTIELLE = "RECEPTION_PARTIELLE"
    STATUT_RECEPTION_COMPLETE = "RECEPTION_COMPLETE"

    STATUT_RECEPTION_CHOICES = [
        (STATUT_RECEPTION_EN_ATTENTE, "En attente"),
        (STATUT_RECEPTION_PARTIELLE, "Reception partielle"),
        (STATUT_RECEPTION_COMPLETE, "Reception complete"),
    ]

    TYPE_ECART_MANQUANT = "MANQUANT"
    TYPE_ECART_DEFECTUEUX = "DEFECTUEUX"
    TYPE_ECART_NON_CONFORME = "NON_CONFORME"
    TYPE_ECART_HORS_SPEC = "HORS_SPECIFICATIONS"

    TYPE_ECART_CHOICES = [
        (TYPE_ECART_MANQUANT, "Manquant"),
        (TYPE_ECART_DEFECTUEUX, "Defectueux"),
        (TYPE_ECART_NON_CONFORME, "Non conforme"),
        (TYPE_ECART_HORS_SPEC, "Hors specifications"),
    ]

    ACTION_CORRECTIVE_REMPLACEMENT = "REMPLACEMENT"
    ACTION_CORRECTIVE_REPARATION = "REPARATION"
    ACTION_CORRECTIVE_AVOIR = "AVOIR"
    ACTION_CORRECTIVE_REJET = "REJET"

    ACTION_CORRECTIVE_CHOICES = [
        (ACTION_CORRECTIVE_REMPLACEMENT, "Remplacement"),
        (ACTION_CORRECTIVE_REPARATION, "Reparation"),
        (ACTION_CORRECTIVE_AVOIR, "Avoir"),
        (ACTION_CORRECTIVE_REJET, "Rejet"),
    ]

    STATUT_FINAL_CLOTURE = "CLOTURE"
    STATUT_FINAL_PARTIEL = "PARTIELLEMENT_EXECUTE"
    STATUT_FINAL_ANNULE = "ANNULE"

    STATUT_FINAL_CHOICES = [
        (STATUT_FINAL_CLOTURE, "Cloture"),
        (STATUT_FINAL_PARTIEL, "Partiellement execute"),
        (STATUT_FINAL_ANNULE, "Annule"),
    ]

    
    numero_demande = models.CharField(max_length=30, unique=True, blank=True)
    version = models.PositiveIntegerField(default=1)

    demandeur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="demandes_achat",
    )

    unite_technique = models.CharField(max_length=255)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUT_BROUILLON,
    )
    etape_validation_actuelle = models.CharField(
        max_length=30,
        choices=ETAPE_VALIDATION_CHOICES,
        default=ETAPE_HIERARCHIQUE,
    )

    categorie_besoin = models.CharField(
        max_length=30,
        choices=CATEGORIE_CHOICES,
    )
    type_demande = models.CharField(
        max_length=30,
        choices=TYPE_DEMANDE_CHOICES,
    )
    priorite = models.CharField(
        max_length=10,
        choices=PRIORITE_CHOICES,
        default=PRIORITE_NORMAL,
    )

    objet = models.CharField(max_length=255)
    justification = models.TextField()
    lien_ptba = models.CharField(max_length=255)
    service_beneficiaire = models.CharField(max_length=255)

    ligne_budgetaire = models.CharField(max_length=100)
    source_financement = models.CharField(
        max_length=30,
        choices=SOURCE_FINANCEMENT_CHOICES,
    )
    numero_subvention = models.CharField(max_length=100, blank=True)
    solde_disponible_ligne_budgetaire = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )
    numero_engagement_budgetaire = models.CharField(max_length=100, blank=True)
    solde_apres_engagement = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )
    cout_total_estime = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    type_procedure = models.CharField(
        max_length=30,
        choices=TYPE_PROCEDURE_CHOICES,
        blank=True,
    )
    fournisseur_retenu = models.CharField(max_length=255, blank=True)
    numero_bon_commande = models.CharField(max_length=30, blank=True)
    date_bon_commande = models.DateField(null=True, blank=True)
    montant_commande = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )
    delai_livraison_contractuel = models.PositiveIntegerField(null=True, blank=True)
    date_livraison_prevue = models.DateField(null=True, blank=True)
    conditions_livraison = models.CharField(max_length=255, blank=True)
    garantie = models.CharField(max_length=255, blank=True)

    date_arrivee_prevue = models.DateField(null=True, blank=True)
    date_arrivee_effective = models.DateField(null=True, blank=True)
    etat_expedition = models.CharField(
        max_length=20,
        choices=ETAT_EXPEDITION_CHOICES,
        blank=True,
    )

    date_reception = models.DateField(null=True, blank=True)
    receptionnaire = models.CharField(max_length=255, blank=True)
    conformite_quantite = models.CharField(
        max_length=20,
        choices=CONFORMITE_QUANTITE_CHOICES,
        blank=True,
    )
    conformite_qualite = models.CharField(
        max_length=20,
        choices=CONFORMITE_QUALITE_CHOICES,
        blank=True,
    )
    observations_reception = models.TextField(blank=True)
    statut_reception = models.CharField(
        max_length=30,
        choices=STATUT_RECEPTION_CHOICES,
        default=STATUT_RECEPTION_EN_ATTENTE,
    )

    type_ecart = models.CharField(
        max_length=30,
        choices=TYPE_ECART_CHOICES,
        blank=True,
    )
    description_ecart = models.TextField(blank=True)
    action_corrective = models.CharField(
        max_length=30,
        choices=ACTION_CORRECTIVE_CHOICES,
        blank=True,
    )
    date_resolution = models.DateField(null=True, blank=True)
    suivi_resolution = models.TextField(blank=True)

    statut_final = models.CharField(
        max_length=30,
        choices=STATUT_FINAL_CHOICES,
        blank=True,
    )
    date_cloture = models.DateField(null=True, blank=True)
    niveau_satisfaction = models.PositiveSmallIntegerField(null=True, blank=True)
    commentaires_finaux = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.numero_demande or self.objet
