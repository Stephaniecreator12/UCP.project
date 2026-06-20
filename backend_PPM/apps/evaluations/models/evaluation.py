from decimal import Decimal

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from apps.procurement.models.procurement_market import ProcurementMarket

class StatutEvaluation(models.TextChoices):
    EN_COURS = "EN_COURS", "Évaluation en cours"
    ELIMINE_PRELIMINAIRE = "ELIMINE_PRELIMINAIRE", "Éliminé à l'examen préliminaire"
    ELIMINE_TECHNIQUE = "ELIMINE_TECHNIQUE", "Éliminé à l'évaluation technique"
    CONSENSUS_REQUIS = "CONSENSUS_REQUIS", "Consensus requis entre évaluateurs"
    QUALIFIE_FINANCIER = "QUALIFIE_FINANCIER", "Qualifié pour ouverture financière"
    FINALISE = "FINALISE", "Évaluation finalisée"


class RoleEvaluateur(models.TextChoices):
    EVALUATEUR_1 = "EVALUATEUR_1", "Évaluateur 1"
    EVALUATEUR_2 = "EVALUATEUR_2", "Évaluateur 2"
    EVALUATEUR_3 = "EVALUATEUR_3", "Évaluateur 3"


class RecommandationFinale(models.TextChoices):
    ATTRIBUER = "ATTRIBUER", "Attribuer le marché"
    REJETER = "REJETER", "Rejeter l'offre"
    RELANCER = "RELANCER", "Relancer l'appel d'offres"



class Soumissionnaire(models.Model):
    nom = models.CharField(max_length=255)
    nif_stat = models.CharField("NIF / STAT", max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Soumissionnaire"
        verbose_name_plural = "Soumissionnaires"
        indexes = [models.Index(fields=["nom"])]

    def __str__(self):
        return self.nom




class EvaluationConfig(models.Model):
    marche = models.ForeignKey(
        ProcurementMarket,
        on_delete=models.CASCADE,
        related_name="config_evaluation",
    )
    seuil_elimination_technique = models.PositiveSmallIntegerField(
        default=70,
        validators=[MaxValueValidator(100)],
        help_text="Score technique minimum (/100) pour être qualifié à l'ouverture financière.",
    )
    poids_technique = models.PositiveSmallIntegerField(default=60)
    poids_financier = models.PositiveSmallIntegerField(default=40)
    seuil_ecart_consensus = models.PositiveSmallIntegerField(
        default=15,
        help_text="Écart max toléré entre évaluateur 1 et évaluateur 2 (score technique total) avant consensus requis.",
    )
    nombre_validateurs_requis_double_aveugle = models.PositiveSmallIntegerField(
        default=3,
        help_text="Nombre d'évaluateurs devant valider le score technique avant déverrouillage du module financier.",
    )

    class Meta:
        verbose_name = "Configuration d'évaluation"
        verbose_name_plural = "Configurations d'évaluation"

    def clean(self):
        if self.poids_technique + self.poids_financier != 100:
            raise ValidationError(
                "La somme des pondérations technique et financière doit être égale à 100."
            )

    def __str__(self):
        return f"Config évaluation – {self.marche.reference_number}"



class CritereTechnique(models.Model):
    marche = models.ForeignKey(
        ProcurementMarket,
        on_delete=models.CASCADE,
        related_name="criteres_techniques",
    )
    libelle = models.CharField(max_length=255)
    ponderation = models.PositiveSmallIntegerField(
        validators=[MaxValueValidator(100)],
        help_text="Poids en %. La somme des critères actifs d'un AO doit être égale à 100.",
    )
    ordre = models.PositiveSmallIntegerField(default=0)
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ["ordre", "id"]
        verbose_name = "Critère technique"
        verbose_name_plural = "Critères techniques"

    def __str__(self):
        return f"{self.libelle} ({self.ponderation}%)"



class AuditTrail(models.Model):
    class Action(models.TextChoices):
        CREATE = "CREATE", "Création"
        UPDATE = "UPDATE", "Modification"
        DELETE = "DELETE", "Suppression"

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    objet = GenericForeignKey("content_type", "object_id")

    action = models.CharField(max_length=10, choices=Action.choices)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)

    external_user_id = models.CharField(max_length=150)
    external_user_label = models.CharField(max_length=255, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Piste d'audit"
        verbose_name_plural = "Piste d'audit"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["-timestamp"]),
        ]

    def __str__(self):
        return f"{self.action} – {self.content_type} #{self.object_id} – {self.timestamp:%Y-%m-%d %H:%M}"


class AuditableMixin(models.Model):
    """
    Helper pour journaliser une action dans AuditTrail. Le LFA exige une
    ligne old_value/new_value pour chaque UPDATE sur les tables d'éval :
    appelez `enregistrer_audit(...)` depuis vos vues/serializers (ex. dans
    `perform_update`), en lui passant l'external_user_id résolu depuis le
    jeton RH (ExternalUser.token -> lookup base `external_users`).
    """

    class Meta:
        abstract = True

    def enregistrer_audit(self, action, old_value, new_value, external_user_id, external_user_label=""):
        return AuditTrail.objects.create(
            content_type=ContentType.objects.get_for_model(self.__class__),
            object_id=self.pk,
            action=action,
            old_value=old_value,
            new_value=new_value,
            external_user_id=external_user_id,
            external_user_label=external_user_label,
        )



class EvaluationHeader(AuditableMixin, models.Model):
    marche = models.ForeignKey(
        ProcurementMarket,
        on_delete=models.CASCADE,
        related_name="evaluations",
    )
    soumissionnaire = models.ForeignKey(
        Soumissionnaire,
        on_delete=models.PROTECT,
        related_name="evaluations",
    )
    lot_numero = models.CharField(max_length=50, blank=True, null=True)

    statut = models.CharField(
        max_length=30,
        choices=StatutEvaluation.choices,
        default=StatutEvaluation.EN_COURS,
    )

    cree_par_external_id = models.CharField(max_length=150)
    cree_par_label = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["marche", "soumissionnaire", "lot_numero"],
                name="uniq_evaluation_par_lot",
            )
        ]
        ordering = ["-created_at"]
        verbose_name = "Évaluation d'offre"
        verbose_name_plural = "Évaluations d'offres"

    def __str__(self):
        return f"Évaluation {self.soumissionnaire} – {self.marche.reference_number}"

    @property
    def config(self):
        return getattr(self.marche, "config_evaluation", None)

    @property
    def bloquer_etape_suivante(self):
        """Section 2 : un seul critère = NON bloque le passage à la suite."""
        examen = getattr(self, "examen_preliminaire", None)
        return bool(examen and examen.is_conforme is False)

    @property
    def nombre_evaluateurs_ayant_valide_technique(self):
        return self.evaluateurs.filter(a_valide_score_technique=True).count()

    @property
    def financier_deverrouille(self):
        """
        Point critique #1 (double aveugle) : `role_permission: voir_prix`
        doit rester désactivé tant que le score technique n'a pas été
        validé (>= seuil) par le nombre requis d'évaluateurs.
        """
        config = self.config
        seuil = config.seuil_elimination_technique if config else 70
        requis = config.nombre_validateurs_requis_double_aveugle if config else 3
        validants = self.evaluateurs.filter(
            a_valide_score_technique=True,
            score_technique_total__gte=seuil,
        ).count()
        return validants >= requis

    def verifier_consensus(self):
        """
        Point critique #3 : si |note_eval1 - note_eval2| > seuil ->
        statut = CONSENSUS_REQUIS et consolidation bloquée.
        """
        config = self.config
        seuil_ecart = config.seuil_ecart_consensus if config else 15
        try:
            e1 = self.evaluateurs.get(role=RoleEvaluateur.EVALUATEUR_1)
            e2 = self.evaluateurs.get(role=RoleEvaluateur.EVALUATEUR_2)
        except Evaluateur.DoesNotExist:
            return False

        if e1.score_technique_total is None or e2.score_technique_total is None:
            return False

        ecart = abs(e1.score_technique_total - e2.score_technique_total)
        if ecart > seuil_ecart:
            self.statut = StatutEvaluation.CONSENSUS_REQUIS
            self.save(update_fields=["statut"])
            return True
        return False


class ExamenPreliminaire(AuditableMixin, models.Model):
    evaluation = models.OneToOneField(
        EvaluationHeader,
        on_delete=models.CASCADE,
        related_name="examen_preliminaire",
    )

    offre_signee_personne_habilitee = models.BooleanField(null=True, blank=True)
    garantie_soumission_conforme = models.BooleanField(null=True, blank=True)
    dossier_administratif_complet = models.BooleanField(
        null=True, blank=True,
        help_text="NIF, STAT, RCS, Quitus fiscal",
    )
    validite_offre_conforme = models.BooleanField(null=True, blank=True)
    acceptation_conditions_sans_reserve = models.BooleanField(null=True, blank=True)

    commentaire = models.TextField(blank=True)

    evalue_par_external_id = models.CharField(max_length=150, blank=True)
    evalue_par_label = models.CharField(max_length=255, blank=True)
    evalue_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Examen préliminaire"
        verbose_name_plural = "Examens préliminaires"

    @property
    def criteres(self):
        return [
            self.offre_signee_personne_habilitee,
            self.garantie_soumission_conforme,
            self.dossier_administratif_complet,
            self.validite_offre_conforme,
            self.acceptation_conditions_sans_reserve,
        ]

    @property
    def is_conforme(self):
        """True / False / None (saisie incomplète)."""
        criteres = self.criteres
        if any(c is False for c in criteres):
            return False
        if any(c is None for c in criteres):
            return None
        return True

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_conforme is False and self.evaluation.statut != StatutEvaluation.ELIMINE_PRELIMINAIRE:
            self.evaluation.statut = StatutEvaluation.ELIMINE_PRELIMINAIRE
            self.evaluation.save(update_fields=["statut"])



class Evaluateur(models.Model):
    """
    Identité figée en instantané (cf. hypothèse 3 en en-tête) : la base RH
    externe n'étant pas relationnellement liée à cette base, on capture
    external_user_id + nom_affiche au moment de la désignation plutôt
    qu'une ForeignKey.
    """
    evaluation = models.ForeignKey(
        EvaluationHeader,
        on_delete=models.CASCADE,
        related_name="evaluateurs",
    )
    role = models.CharField(max_length=20, choices=RoleEvaluateur.choices)

    external_user_id = models.CharField(
        max_length=150,
        help_text="Identifiant résolu depuis la base RH via le jeton externe.",
    )
    nom_affiche = models.CharField(max_length=255)

    score_technique_total = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True, editable=False,
    )
    a_valide_score_technique = models.BooleanField(
        default=False,
        help_text="Confirmation explicite par l'évaluateur — utilisée pour le déverrouillage double-aveugle.",
    )

    a_signe = models.BooleanField(default=False)
    date_signature = models.DateTimeField(null=True, blank=True)
    signature_hash = models.CharField(
        max_length=128, blank=True,
        help_text="Empreinte de la signature électronique.",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["evaluation", "role"], name="uniq_role_par_evaluation")
        ]
        ordering = ["role"]
        verbose_name = "Évaluateur"
        verbose_name_plural = "Évaluateurs"

    def __str__(self):
        return f"{self.get_role_display()} – {self.nom_affiche}"

    def recalculer_score_technique(self):
        total = self.notes_techniques.aggregate(total=models.Sum("note_ponderee"))["total"]
        self.score_technique_total = total or Decimal("0")
        self.save(update_fields=["score_technique_total"])
        return self.score_technique_total


class EvaluationTechnique(AuditableMixin, models.Model):
    evaluation = models.ForeignKey(
        EvaluationHeader,
        on_delete=models.CASCADE,
        related_name="evaluations_techniques",
    )
    evaluateur = models.ForeignKey(
        Evaluateur,
        on_delete=models.CASCADE,
        related_name="notes_techniques",
    )
    critere = models.ForeignKey(
        CritereTechnique,
        on_delete=models.PROTECT,
        related_name="notes",
    )

    note_sur_5 = models.DecimalField(
        max_digits=4, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    note_sur_100 = models.DecimalField(max_digits=6, decimal_places=2, editable=False)
    note_ponderee = models.DecimalField(max_digits=6, decimal_places=2, editable=False)

    commentaire = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["evaluation", "evaluateur", "critere"],
                name="uniq_note_par_evaluateur_critere",
            )
        ]
        verbose_name = "Note technique"
        verbose_name_plural = "Notes techniques"

    def clean(self):
        if self.evaluateur_id and self.evaluateur.evaluation_id != self.evaluation_id:
            raise ValidationError("Cet évaluateur n'est pas rattaché à cette évaluation.")
        if self.critere_id and self.critere.marche_id != self.evaluation.marche_id:
            raise ValidationError("Le critère sélectionné n'appartient pas à l'AO de cette évaluation.")

    def save(self, *args, **kwargs):
        self.note_sur_100 = (self.note_sur_5 / Decimal("5")) * Decimal("100")
        self.note_ponderee = (self.note_sur_5 / Decimal("5")) * Decimal(self.critere.ponderation)
        super().save(*args, **kwargs)
        self.evaluateur.recalculer_score_technique()


class EvaluationFinanciere(AuditableMixin, models.Model):
    evaluation = models.OneToOneField(
        EvaluationHeader,
        on_delete=models.CASCADE,
        related_name="evaluation_financiere",
    )

    montant_lu = models.DecimalField(max_digits=18, decimal_places=2, verbose_name="Montant lu de l'offre (MGA)")
    corrections_arithmetiques = models.DecimalField(max_digits=18, decimal_places=2, default=0, blank=True)
    rabais_accordes = models.DecimalField(max_digits=18, decimal_places=2, default=0, blank=True)
    montant_evalue_final = models.DecimalField(max_digits=18, decimal_places=2, editable=False)

    montant_moins_disant = models.DecimalField(
        max_digits=18, decimal_places=2,
        help_text="Montant évalué le plus bas parmi les offres qualifiées du même AO.",
    )
    score_financier = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, editable=False)

    saisi_par_external_id = models.CharField(max_length=150)
    saisi_par_label = models.CharField(max_length=255, blank=True)
    saisi_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Évaluation financière"
        verbose_name_plural = "Évaluations financières"

    def clean(self):
        if not self.evaluation.financier_deverrouille:
            raise ValidationError(
                "Module financier verrouillé : le score technique doit d'abord être validé "
                "par le nombre requis d'évaluateurs (double aveugle Fonds Mondial)."
            )

    def save(self, *args, **kwargs):
        self.montant_evalue_final = (
            self.montant_lu + self.corrections_arithmetiques - self.rabais_accordes
        )
        if self.montant_evalue_final:
            self.score_financier = (self.montant_moins_disant / self.montant_evalue_final) * Decimal("100")
        super().save(*args, **kwargs)


class ScoreConsolide(models.Model):
    """
    Implémenté en table plutôt qu'en vue SQL afin de permettre le
    classement (ORDER BY) entre soumissionnaires d'un même AO. Recalculer
    via `consolider()` après toute mise à jour des scores technique /
    financier, puis `recalculer_classement(marche)` pour le rang.
    """
    evaluation = models.OneToOneField(
        EvaluationHeader,
        on_delete=models.CASCADE,
        related_name="score_consolide",
    )

    score_technique = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    score_financier = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    poids_technique = models.PositiveSmallIntegerField(default=60)
    poids_financier = models.PositiveSmallIntegerField(default=40)

    score_total = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, editable=False)
    rang = models.PositiveSmallIntegerField(null=True, blank=True, editable=False)

    calcule_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["rang"]
        verbose_name = "Score consolidé"
        verbose_name_plural = "Scores consolidés"

    def consolider(self):
        config = self.evaluation.config
        if config:
            self.poids_technique = config.poids_technique
            self.poids_financier = config.poids_financier

        if self.score_technique is not None and self.score_financier is not None:
            self.score_total = (
                self.score_technique * Decimal(self.poids_technique) / Decimal("100")
            ) + (
                self.score_financier * Decimal(self.poids_financier) / Decimal("100")
            )
            self.calcule_le = timezone.now()
            self.save(update_fields=["score_total", "poids_technique", "poids_financier", "calcule_le"])
        return self.score_total

    @classmethod
    def recalculer_classement(cls, marche):
        """Met à jour le rang de tous les soumissionnaires d'un même AO."""
        scores = list(
            cls.objects.filter(evaluation__marche=marche, score_total__isnull=False)
            .order_by("-score_total")
        )
        for index, score in enumerate(scores, start=1):
            score.rang = index
        cls.objects.bulk_update(scores, ["rang"])


class EvaluationDecision(AuditableMixin, models.Model):
    evaluation = models.OneToOneField(
        EvaluationHeader,
        on_delete=models.CASCADE,
        related_name="decision",
    )

    recommandation = models.CharField(max_length=20, choices=RecommandationFinale.choices)
    justification = models.TextField()

    declaration_absence_conflit_interet = models.BooleanField(
        help_text="Oui = le comité déclare n'avoir aucun lien avec le soumissionnaire.",
    )

    decide_par_external_id = models.CharField(max_length=150)
    decide_par_label = models.CharField(max_length=255, blank=True)
    decide_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Décision d'évaluation"
        verbose_name_plural = "Décisions d'évaluation"

    def clean(self):
        if self.evaluation.statut == StatutEvaluation.CONSENSUS_REQUIS:
            raise ValidationError(
                "Conclusion impossible : un consensus est requis entre les évaluateurs (écart > seuil)."
            )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.evaluation.statut = StatutEvaluation.FINALISE
        self.evaluation.save(update_fields=["statut"])

