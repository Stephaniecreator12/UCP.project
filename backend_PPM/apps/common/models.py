from django.db import models
from django.db.utils import DatabaseError


class ChoiceGroup(models.TextChoices):
    # --- Procurement ---
    PROCEDURE_TYPE = "PROCEDURE_TYPE", "Type de procédure"
    CATEGORY_TYPE = "CATEGORY_TYPE", "Catégorie d'achat"
    PUBLICATION_STATUS = "PUBLICATION_STATUS", "Statut de publication"
    FINANCING_SOURCE = "FINANCING_SOURCE", "Source de financement"
    # --- Contrat ---
    CONTRAT_STATUT = "CONTRAT_STATUT", "Statut de contrat"
    DOCUMENT_TYPE_CONTRAT = "DOCUMENT_TYPE_CONTRAT", "Type de document contrat"
    STATUT_PAIEMENT = "STATUT_PAIEMENT", "Statut de paiement"
    ACTION_AUDIT_CONTRAT = "ACTION_AUDIT_CONTRAT", "Action audit contrat"
    # --- Achats ---
    CATEGORIE_BESOIN = "CATEGORIE_BESOIN", "Catégorie de besoin"
    TYPE_DEMANDE_ACHAT = "TYPE_DEMANDE_ACHAT", "Type de demande d'achat"
    PRIORITE_ACHAT = "PRIORITE_ACHAT", "Priorité d'achat"
    SOURCE_FINANCEMENT_DETAIL = "SOURCE_FINANCEMENT_DETAIL", "Source de financement (détaillée)"
    STATUT_DEMANDE_ACHAT = "STATUT_DEMANDE_ACHAT", "Statut de demande d'achat"
    ETAPE_VALIDATION_ACHAT = "ETAPE_VALIDATION_ACHAT", "Étape de validation achat"
    TYPE_PROCEDURE_ACHAT = "TYPE_PROCEDURE_ACHAT", "Type de procédure achat"
    ETAT_EXPEDITION = "ETAT_EXPEDITION", "État d'expédition"
    CONFORMITE_QUANTITE = "CONFORMITE_QUANTITE", "Conformité quantité"
    CONFORMITE_QUALITE = "CONFORMITE_QUALITE", "Conformité qualité"
    STATUT_RECEPTION = "STATUT_RECEPTION", "Statut de réception"
    TYPE_ECART = "TYPE_ECART", "Type d'écart"
    ACTION_CORRECTIVE = "ACTION_CORRECTIVE", "Action corrective"
    STATUT_FINAL_ACHAT = "STATUT_FINAL_ACHAT", "Statut final achat"
    TYPE_DOCUMENT_ACHAT = "TYPE_DOCUMENT_ACHAT", "Type de document achat"
    ACTION_HISTORIQUE_ACHAT = "ACTION_HISTORIQUE_ACHAT", "Action historique achat"
    TYPE_SERVICE_ACHAT = "TYPE_SERVICE_ACHAT", "Type de service"
    DECISION_VALIDATION = "DECISION_VALIDATION", "Décision de validation"
    # --- TDR / ST ---
    TYPE_DOCUMENT_TDR_ST = "TYPE_DOCUMENT_TDR_ST", "Type document TDR/ST"
    STATUT_TDR_ST = "STATUT_TDR_ST", "Statut TDR/ST"
    CATEGORIE_ACTIVITE = "CATEGORIE_ACTIVITE", "Catégorie d'activité"
    DUREE_UNITE = "DUREE_UNITE", "Unité de durée"
    ETAPE_VALIDATION_TDR_ST = "ETAPE_VALIDATION_TDR_ST", "Étape validation TDR/ST"
    DECISION_VALIDATION_TDR_ST = "DECISION_VALIDATION_TDR_ST", "Décision validation TDR/ST"
    # --- Évaluation ---
    STATUT_EVALUATION = "STATUT_EVALUATION", "Statut d'évaluation"
    RECOMMANDATION_EVALUATION = "RECOMMANDATION_EVALUATION", "Recommandation évaluation"
    DECLARATION_CONFLIT = "DECLARATION_CONFLIT", "Déclaration de conflit"
    STATUT_DAO_EVALUATION = "STATUT_DAO_EVALUATION", "Statut DAO évaluation"
    # --- Ouverture ---
    STATUT_SEANCE = "STATUT_SEANCE", "Statut séance d'ouverture"
    DECISION_SEANCE = "DECISION_SEANCE", "Décision séance d'ouverture"
    ETAPE_OUVERTURE = "ETAPE_OUVERTURE", "Étape d'ouverture"
    ETAT_SCELLE = "ETAT_SCELLE", "État du scellé"
    ETAT_ENVELOPPE = "ETAT_ENVELOPPE", "État d'enveloppe"
    DECISION_MEMBRE_SEANCE = "DECISION_MEMBRE_SEANCE", "Décision membre séance"
    # --- Users ---
    TYPE_ENTITE = "TYPE_ENTITE", "Type d'entité"
    SEXE = "SEXE", "Sexe"
    # --- Log ---
    TYPE_LOG_DOCUMENT = "TYPE_LOG_DOCUMENT", "Type de document (log)"


class ReferenceChoice(models.Model):
    group = models.CharField(
        max_length=64,
        choices=ChoiceGroup.choices,
        db_index=True,
    )
    code = models.CharField(max_length=64)
    label = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["group", "sort_order", "code"]
        constraints = [
            models.UniqueConstraint(
                fields=["group", "code"],
                name="unique_group_code",
            )
        ]
        verbose_name = "Choix de référence"
        verbose_name_plural = "Choix de référence"

    def __str__(self):
        return f"[{self.group}] {self.code} — {self.label}"


def reference_choices(group, default_choices=()):
    """Renvoie les choix actifs stockés en base pour `group`.

    Les valeurs en base font foi (elles sont éditables via l'admin Django).
    Si la table n'existe pas encore ou ne contient aucun enregistrement,
    on retombe sur `default_choices` pour ne jamais casser l'application.
    """
    try:
        values = list(
            ReferenceChoice.objects.filter(group=group, is_active=True)
            .order_by("sort_order", "code")
            .values_list("code", "label")
        )
    except DatabaseError:
        values = []
    return values or list(default_choices)


def reference_codes(group, default_choices=()):
    """Renvoie la liste des codes actifs pour `group` (validation API)."""
    return [code for code, _ in reference_choices(group, default_choices)]
