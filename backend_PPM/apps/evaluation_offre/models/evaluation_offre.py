from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from decimal import Decimal

from apps.ouverture_offre.models import OffreOuverture, SeanceOuverture
from apps.procurement.models.procurement_market import (
    CategoryType,
    _category_type_choices,
)
from apps.common.models import ChoiceGroup, reference_choices

User = get_user_model()


class StatutEvaluation(models.TextChoices):
    EN_COURS         = "EN_COURS",         "En cours"
    CONSENSUS_REQUIS = "CONSENSUS_REQUIS", "Consensus requis"
    COMPLETE         = "COMPLETE",         "Complète"
    ELIMINEE         = "ELIMINEE",         "Éliminée"


class RecommandationType(models.TextChoices):
    ATTRIBUER = "ATTRIBUER", "Attribuer le marché"
    REJETER   = "REJETER",   "Rejeter l'offre"
    RELANCER  = "RELANCER",  "Relancer l'appel d'offres"


class DeclarationConflitType(models.TextChoices):
    OUI = "OUI", "Oui — aucun lien avec le soumissionnaire"
    NON = "NON", "Non — conflit d'intérêt déclaré"


class StatutDaoEvaluation(models.TextChoices):
    A_ASSIGNER = "A_ASSIGNER", "À assigner"
    EN_EVALUATION = "EN_EVALUATION", "En évaluation"
    TERMINE = "TERMINE", "Terminé"


def _statut_evaluation_choices():
    defaults = [
        ("EN_COURS", "En cours"),
        ("CONSENSUS_REQUIS", "Consensus requis"),
        ("COMPLETE", "Complète"),
        ("ELIMINEE", "Éliminée"),
    ]
    return reference_choices(ChoiceGroup.STATUT_EVALUATION, defaults)


def _recommandation_evaluation_choices():
    defaults = [
        ("ATTRIBUER", "Attribuer le marché"),
        ("REJETER", "Rejeter l'offre"),
        ("RELANCER", "Relancer l'appel d'offres"),
    ]
    return reference_choices(ChoiceGroup.RECOMMANDATION_EVALUATION, defaults)


def _declaration_conflit_choices():
    defaults = [
        ("OUI", "Oui — aucun lien avec le soumissionnaire"),
        ("NON", "Non — conflit d'intérêt déclaré"),
    ]
    return reference_choices(ChoiceGroup.DECLARATION_CONFLIT, defaults)


def _statut_dao_evaluation_choices():
    defaults = [
        ("A_ASSIGNER", "À assigner"),
        ("EN_EVALUATION", "En évaluation"),
        ("TERMINE", "Terminé"),
    ]
    return reference_choices(ChoiceGroup.STATUT_DAO_EVALUATION, defaults)


# ============================================================
# ASSIGNATION AU NIVEAU DAO (1 ligne = 1 évaluateur / séance)
# ============================================================
class EvaluationSeanceAssignation(models.Model):
    seance = models.ForeignKey(
        SeanceOuverture,
        on_delete=models.CASCADE,
        related_name="evaluation_assignations",
    )
    evaluateur = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="evaluation_seance_assignations",
    )
    evaluateur_nom_prenom = models.CharField(max_length=255, blank=True)
    evaluateur_email = models.EmailField(blank=True)
    evaluateur_entite = models.CharField(max_length=255, blank=True)
    evaluateur_poste = models.CharField(max_length=255, blank=True)
    evaluateur_numero_carte = models.CharField(max_length=50, blank=True)
    date_evaluation = models.DateField(null=True, blank=True)
    heure_evaluation = models.TimeField(null=True, blank=True)
    evaluation_password_hash = models.CharField(max_length=128, blank=True)
    evaluation_password_generated_at = models.DateTimeField(null=True, blank=True)
    evaluation_password_revoked_at = models.DateTimeField(null=True, blank=True)
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="evaluation_seances_assignees",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("seance", "evaluateur")
        ordering = ["seance", "evaluateur"]

    def __str__(self):
        return f"{self.seance.reference_dossier} — {self.evaluateur_email}"


# ============================================================
# TABLE PRINCIPALE
# 1 ligne = 1 évaluateur évalue 1 offre
# Si 3 évaluateurs → 3 lignes pour la même offre
# ============================================================
class EvaluationOffre(models.Model):
    offre = models.ForeignKey(
        OffreOuverture,
        on_delete=models.CASCADE,
        related_name="evaluations",
    )
    evaluateur = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="evaluations_faites",
    )
    evaluateur_nom_prenom = models.CharField(max_length=255, blank=True)
    evaluateur_email = models.EmailField(blank=True)
    evaluateur_entite = models.CharField(max_length=255, blank=True)
    evaluateur_poste = models.CharField(max_length=255, blank=True)
    evaluateur_numero_carte = models.CharField(max_length=50, blank=True)
    statut = models.CharField(
        max_length=20,
        choices=_statut_evaluation_choices,
        default=StatutEvaluation.EN_COURS,
    )
    date_evaluation = models.DateField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    evaluation_password_hash = models.CharField(max_length=128, blank=True)
    evaluation_password_generated_at = models.DateTimeField(null=True, blank=True)
    evaluation_password_consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("offre", "evaluateur")
        ordering = ["offre", "evaluateur"]

    def __str__(self):
        return f"Eval de {self.evaluateur} sur {self.offre}"


# ============================================================
# SECTION 2 : EXAMEN PRÉLIMINAIRE
# Si 1 critère = False → offre éliminée directement
# ============================================================
class ExamenPreliminaire(models.Model):
    evaluation = models.OneToOneField(
        EvaluationOffre,
        on_delete=models.CASCADE,
        related_name="examen_preliminaire",
    )
    offre_signee          = models.BooleanField(default=False)
    garantie_conforme     = models.BooleanField(default=False)
    dossier_admin_complet = models.BooleanField(default=False)  # NIF, STAT, RCS, Quitus
    validite_conforme     = models.BooleanField(default=False)
    conditions_acceptees  = models.BooleanField(default=False)
    commentaire           = models.TextField(blank=True)
    est_conforme          = models.BooleanField(default=False)  # calculé auto

    def save(self, *args, **kwargs):
        self.est_conforme = all([
            self.offre_signee,
            self.garantie_conforme,
            self.dossier_admin_complet,
            self.validite_conforme,
            self.conditions_acceptees,
        ])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Examen préliminaire — {self.evaluation}"


# ============================================================
# TEMPLATES DE CRITÈRES PAR CATÉGORIE D'ACHAT
# Bibliothèque configurable par l'admin : quels critères
# s'appliquent à quelle catégorie (BIENS / SERVICES / INFRA ...)
# ============================================================
class CritereTemplate(models.Model):
    """Modèle de critère technique rattaché à une catégorie d'achat.

    L'admin configure une fois ; les séances héritent automatiquement
    lors de la création des critères par défaut.
    Un même nom peut exister dans plusieurs catégories avec des
    pondérations différentes.
    """
    category_type = models.CharField(
        max_length=20,
        choices=_category_type_choices,
        db_index=True,
        help_text="Catégorie d'achat à laquelle ce modèle de critère s'applique",
    )
    nom = models.CharField(
        max_length=255,
        help_text="Libellé du critère (ex: Conformité technique)",
    )
    description = models.TextField(
        blank=True,
        help_text="Description du critère pour les évaluateurs",
    )
    ponderation = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Pondération en pourcentage (ex: 40.00 pour 40 points)",
    )
    ordre = models.PositiveIntegerField(default=0)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category_type", "ordre", "nom"]
        unique_together = ("category_type", "nom")
        verbose_name = "Modèle de critère technique"
        verbose_name_plural = "Modèles de critères techniques"

    def __str__(self):
        return f"[{self.category_type}] {self.nom} ({self.ponderation})"


# ============================================================
# CRITÈRES TECHNIQUES CONFIGURABLES (par séance)
# Source unique de vérité pour les critères et pondérations
# Créés automatiquement à partir des CritereTemplate de la catégorie
# ============================================================
class CritereTechnique(models.Model):
    seance = models.ForeignKey(
        SeanceOuverture,
        on_delete=models.CASCADE,
        related_name="criteres_techniques",
    )
    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True, help_text="Description du critère pour les évaluateurs")
    ponderation = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Pondération en pourcentage (ex: 40.00 pour 40 points)"
    )
    ordre = models.PositiveIntegerField(default=0)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["seance", "ordre", "nom"]
        unique_together = ("seance", "nom")

    def __str__(self):
        return f"{self.seance.reference_dossier} — {self.nom} ({self.ponderation})"

    @classmethod
    def creer_defauts_pour_seance(cls, seance, category_type=None):
        """Crée les critères techniques pour une séance à partir des templates.

        Args:
            seance: instance SeanceOuverture
            category_type: code catégorie (BIENS, SERVICES, INFRA…).
                Si None, la catégorie est résolue depuis le ProcurementMarket
                lié à la séance via reference_dossier.
        """
        if category_type is None:
            category_type = cls._resoudre_category(seance)
        if category_type is None:
            return

        templates = CritereTemplate.objects.filter(
            category_type=category_type,
            actif=True,
        ).order_by("ordre", "nom")

        for tpl in templates:
            cls.objects.get_or_create(
                seance=seance,
                nom=tpl.nom,
                defaults={
                    "description": tpl.description,
                    "ponderation": tpl.ponderation,
                    "ordre": tpl.ordre,
                    "actif": tpl.actif,
                },
            )

    @staticmethod
    def _resoudre_category(seance):
        """Résout la catégorie d'achat d'une séance.

        Utilise d'abord le champ denormalisé category_type de la séance,
        puis fallback sur le ProcurementMarket si la séance n'a pas de catégorie.
        """
        if getattr(seance, "category_type", ""):
            return seance.category_type
        from apps.procurement.models.procurement_market import ProcurementMarket
        market = ProcurementMarket.objects.filter(
            reference_number=seance.reference_dossier,
        ).first()
        return market.category if market else None


# ============================================================
# SECTION 3 : ÉVALUATION TECHNIQUE
# Notes dynamiques basées sur CritereTechnique de la séance
# ============================================================
class EvaluationTechnique(models.Model):
    evaluation = models.OneToOneField(
        EvaluationOffre,
        on_delete=models.CASCADE,
        related_name="evaluation_technique",
    )
    # Calculé automatiquement — jamais saisi à la main
    score_technique_total = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        editable=False,
    )
    qualifie_technique = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_criteres(self):
        """Retourne les critères actifs de la séance liée à cette évaluation"""
        seance = self.evaluation.offre.seance
        return seance.criteres_techniques.filter(actif=True).order_by("ordre", "nom")

    def get_notes(self):
        """Retourne toutes les notes pour cette évaluation technique"""
        return self.notes_criteres.select_related("critere").all()

    def get_note_pour_critere(self, critere):
        """Retourne la note pour un critère donné, ou None"""
        try:
            return self.notes_criteres.get(critere=critere).note
        except NoteTechniqueCritere.DoesNotExist:
            return None

    def calculer_score(self):
        """Calcule le score pondéré basé sur les critères actifs de la séance"""
        criteres = self.get_criteres()
        if not criteres.exists():
            return None

        total_ponderation = sum(c.ponderation for c in criteres)
        if total_ponderation == 0:
            return None

        score = Decimal("0")
        notes_manquantes = False

        for critere in criteres:
            note = self.get_note_pour_critere(critere)
            if note is None:
                notes_manquantes = True
                break
            # note sur 5 → sur 100 → pondéré
            score += (Decimal(str(note)) / Decimal("5") * Decimal("100") * critere.ponderation / Decimal("100"))

        if notes_manquantes:
            return None

        return round(score, 2)

    def save(self, *args, **kwargs):
        score = self.calculer_score()
        self.score_technique_total = score
        if score is not None:
            self.qualifie_technique = score >= 70
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Technique — {self.evaluation} — {self.score_technique_total}/100"


class NoteTechniqueCritere(models.Model):
    """Note d'un critère technique pour une évaluation donnée"""
    evaluation_technique = models.ForeignKey(
        EvaluationTechnique,
        on_delete=models.CASCADE,
        related_name="notes_criteres",
    )
    critere = models.ForeignKey(
        CritereTechnique,
        on_delete=models.PROTECT,
        related_name="notes",
    )
    note = models.DecimalField(
        max_digits=3, decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Note sur 5"
    )
    commentaire = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("evaluation_technique", "critere")
        ordering = ["critere__ordre", "critere__nom"]

    def __str__(self):
        return f"{self.evaluation_technique} — {self.critere.nom}: {self.note}/5"


# ============================================================
# SECTION 4 : ÉVALUATION FINANCIÈRE
# Visible SEULEMENT après validation technique des 3 évaluateurs
# C'est le principe du double aveugle
# ============================================================
class EvaluationFinanciere(models.Model):
    evaluation = models.OneToOneField(
        EvaluationOffre,
        on_delete=models.CASCADE,
        related_name="evaluation_financiere",
    )
    montant_lu = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        help_text="Montant tel que lu dans l'offre (MGA)"
    )
    corrections_arithmetiques = models.DecimalField(
        max_digits=18, decimal_places=2,
        default=Decimal("0"),
    )
    rabais_accordes = models.DecimalField(
        max_digits=18, decimal_places=2,
        default=Decimal("0"),
    )
    montant_evalue_final = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        editable=False,
    )
    offre_moins_disante = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
    )
    score_financier = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        editable=False,
    )

    def save(self, *args, **kwargs):
        if self.montant_lu is not None:
            self.montant_evalue_final = round(
                float(self.montant_lu)
                - float(self.corrections_arithmetiques)
                - float(self.rabais_accordes),
                2
            )
        if self.montant_evalue_final and self.offre_moins_disante:
            self.score_financier = round(
                float(self.offre_moins_disante) / float(self.montant_evalue_final) * 100,
                2
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Financier — {self.evaluation} — Score: {self.score_financier}"


# ============================================================
# SECTION 5 : CONCLUSION PAR ÉVALUATEUR (1 par EvaluationOffre)
# ============================================================
class EvaluationConclusion(models.Model):
    evaluation = models.OneToOneField(
        EvaluationOffre,
        on_delete=models.CASCADE,
        related_name="conclusion",
    )
    recommandation = models.CharField(
        max_length=20,
        choices=_recommandation_evaluation_choices,
        null=True,
        blank=True,
    )
    justification = models.TextField(blank=True)
    declaration_conflit = models.CharField(
        max_length=3,
        choices=_declaration_conflit_choices,
        blank=True,
    )
    signe_le = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Conclusion — {self.evaluation}"


# ============================================================
# SECTION 6 : DÉCISION FINALE CONSOLIDÉE (une par offre)
# ============================================================
class DecisionFinale(models.Model):
    offre = models.OneToOneField(
        OffreOuverture,
        on_delete=models.CASCADE,
        related_name="decision_finale",
    )
    score_technique_consolide = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    score_financier_consolide = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    score_final = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        editable=False,
    )
    classement        = models.PositiveIntegerField(null=True, blank=True)
    recommandation    = models.CharField(
        max_length=20,
        choices=_recommandation_evaluation_choices,
        null=True, blank=True,
    )
    justification         = models.TextField(blank=True)
    declaration_conflit   = models.BooleanField(default=False)
    created_at            = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.score_technique_consolide and self.score_financier_consolide:
            self.score_final = round(
                float(self.score_technique_consolide) * 0.60 +
                float(self.score_financier_consolide) * 0.40,
                2
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Décision — {self.offre} — {self.recommandation}"


# ============================================================
# PISTE D'AUDIT (obligatoire Fonds Mondial)
# Chaque modification crée une ligne ici
# L'auditeur LFA vérifie cette table
# ============================================================
class AuditTrail(models.Model):
    utilisateur       = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="audit_trails",
    )
    table_modifiee    = models.CharField(max_length=100)    # ex: "EvaluationTechnique"
    id_enregistrement = models.PositiveIntegerField()       # id de la ligne modifiée
    action            = models.CharField(max_length=10)     # CREATE, UPDATE, DELETE
    champ_modifie     = models.CharField(max_length=100, blank=True)
    ancienne_valeur   = models.TextField(blank=True)        # old_value
    nouvelle_valeur   = models.TextField(blank=True)        # new_value
    timestamp         = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.action} sur {self.table_modifiee}#{self.id_enregistrement} par {self.utilisateur}"