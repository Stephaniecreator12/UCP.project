from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from decimal import Decimal

from apps.ouverture_offre.models import OffreOuverture, SeanceOuverture

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
        choices=StatutEvaluation.choices,
        default=StatutEvaluation.EN_COURS,
    )
    date_evaluation = models.DateField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    # Code d'accès temporaire pour évaluer sans compte (optionnel)
    evaluation_password_hash = models.CharField(max_length=128, blank=True)
    evaluation_password_generated_at = models.DateTimeField(null=True, blank=True)
    evaluation_password_consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        # Un évaluateur ne peut pas évaluer 2 fois la même offre
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
        # Tous les critères doivent être True pour être conforme
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
# SECTION 3 : ÉVALUATION TECHNIQUE
# Note /5 sur 4 critères → score pondéré /100
# Seuil éliminatoire : 70/100
# ============================================================
class EvaluationTechnique(models.Model):
    evaluation = models.OneToOneField(
        EvaluationOffre,
        on_delete=models.CASCADE,
        related_name="evaluation_technique",
    )
    # Critère 1 — Conformité technique (pondération 40%)
    note_conformite_technique = models.DecimalField(
        max_digits=3, decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        null=True, blank=True,
    )
    # Critère 2 — Délai de livraison (pondération 25%)
    note_delai_livraison = models.DecimalField(
        max_digits=3, decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        null=True, blank=True,
    )
    # Critère 3 — Expérience marchés similaires (pondération 20%)
    note_experience = models.DecimalField(
        max_digits=3, decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        null=True, blank=True,
    )
    # Critère 4 — SAV, garantie, formation (pondération 15%)
    note_sav_garantie = models.DecimalField(
        max_digits=3, decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        null=True, blank=True,
    )
    # Calculé automatiquement — jamais saisi à la main
    score_technique_total = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        editable=False,
    )
    qualifie_technique = models.BooleanField(default=False)

    def calculer_score(self):
        notes = [
            self.note_conformite_technique,
            self.note_delai_livraison,
             self.note_experience,
             self.note_sav_garantie,
      ]
        # Si une note manque → on retourne None
        if any(n is None for n in notes):
             return None

         # Maintenant Python sait qu'aucune n'est None
        return round(
            (float(self.note_conformite_technique or 0) / 5 * 100 * 0.40) +
            (float(self.note_delai_livraison or 0)       / 5 * 100 * 0.25) +
            (float(self.note_experience or 0)            / 5 * 100 * 0.20) +
            (float(self.note_sav_garantie or 0)          / 5 * 100 * 0.15),
            2
        )
    
    def save(self, *args, **kwargs):
        score = self.calculer_score()
        self.score_technique_total = score
        if score is not None:
            self.qualifie_technique = score >= 70
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Technique — {self.evaluation} — {self.score_technique_total}/100"


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
    # Calculé : montant_lu - corrections - rabais
    montant_evalue_final = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        editable=False,
    )
    # Le meilleur prix parmi toutes les offres (rempli par le système)
    offre_moins_disante = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
    )
    # Score financier = (moins_disant / montant_évalué) * 100
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
        choices=RecommandationType.choices,
        null=True,
        blank=True,
    )
    justification = models.TextField(blank=True)
    declaration_conflit = models.CharField(
        max_length=3,
        choices=DeclarationConflitType.choices,
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
    # Moyennes des 3 évaluateurs
    score_technique_consolide = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    score_financier_consolide = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    # Score final = technique*60% + financier*40%
    score_final = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        editable=False,
    )
    classement        = models.PositiveIntegerField(null=True, blank=True)
    recommandation    = models.CharField(
        max_length=20,
        choices=RecommandationType.choices,
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
