from rest_framework import serializers

from apps.evaluations.models.evaluation import (
    AuditTrail,
    CritereTechnique,
    Evaluateur,
    EvaluationConfig,
    EvaluationDecision,
    EvaluationFinanciere,
    EvaluationHeader,
    EvaluationTechnique,
    ExamenPreliminaire,
    ScoreConsolide,
    Soumissionnaire,
    StatutEvaluation,
)


class SoumissionnaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Soumissionnaire
        fields = ["id", "nom", "nif_stat", "created_at"]
        read_only_fields = ["created_at"]


class EvaluationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationConfig
        fields = [
            "id",
            "marche",
            "seuil_elimination_technique",
            "poids_technique",
            "poids_financier",
            "seuil_ecart_consensus",
            "nombre_validateurs_requis_double_aveugle",
        ]

    def validate(self, attrs):
        poids_technique = attrs.get(
            "poids_technique",
            getattr(self.instance, "poids_technique", 60),
        )
        poids_financier = attrs.get(
            "poids_financier",
            getattr(self.instance, "poids_financier", 40),
        )
        if poids_technique + poids_financier != 100:
            raise serializers.ValidationError(
                "La somme des pondérations technique et financière doit être égale à 100."
            )
        return attrs


class CritereTechniqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = CritereTechnique
        fields = ["id", "marche", "libelle", "ponderation", "ordre", "actif"]


class EvaluationHeaderSerializer(serializers.ModelSerializer):
    bloquer_etape_suivante = serializers.ReadOnlyField()
    financier_deverrouille = serializers.ReadOnlyField()
    nombre_evaluateurs_ayant_valide_technique = serializers.ReadOnlyField()

    class Meta:
        model = EvaluationHeader
        fields = [
            "id",
            "marche",
            "soumissionnaire",
            "lot_numero",
            "statut",
            "cree_par_external_id",
            "cree_par_label",
            "created_at",
            "updated_at",
            "bloquer_etape_suivante",
            "financier_deverrouille",
            "nombre_evaluateurs_ayant_valide_technique",
        ]
        read_only_fields = [
            "statut",
            "cree_par_external_id",
            "cree_par_label",
            "created_at",
            "updated_at",
        ]


class ExamenPreliminaireSerializer(serializers.ModelSerializer):
    is_conforme = serializers.ReadOnlyField()

    class Meta:
        model = ExamenPreliminaire
        fields = [
            "id",
            "evaluation",
            "offre_signee_personne_habilitee",
            "garantie_soumission_conforme",
            "dossier_administratif_complet",
            "validite_offre_conforme",
            "acceptation_conditions_sans_reserve",
            "commentaire",
            "is_conforme",
            "evalue_par_external_id",
            "evalue_par_label",
            "evalue_le",
        ]
        read_only_fields = [
            "evalue_par_external_id",
            "evalue_par_label",
            "evalue_le",
        ]


class EvaluateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluateur
        fields = [
            "id",
            "evaluation",
            "role",
            "external_user_id",
            "nom_affiche",
            "score_technique_total",
            "a_valide_score_technique",
            "a_signe",
            "date_signature",
            "signature_hash",
        ]
        read_only_fields = [
            "score_technique_total",
            "a_valide_score_technique",
            "a_signe",
            "date_signature",
            "signature_hash",
        ]


class EvaluationTechniqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationTechnique
        fields = [
            "id",
            "evaluation",
            "evaluateur",
            "critere",
            "note_sur_5",
            "note_sur_100",
            "note_ponderee",
            "commentaire",
        ]
        read_only_fields = ["note_sur_100", "note_ponderee"]

    def validate(self, attrs):
        evaluateur = attrs.get("evaluateur") or getattr(self.instance, "evaluateur", None)
        evaluation = attrs.get("evaluation") or getattr(self.instance, "evaluation", None)
        critere = attrs.get("critere") or getattr(self.instance, "critere", None)

        if evaluateur and evaluateur.a_valide_score_technique:
            raise serializers.ValidationError(
                "Cet évaluateur a déjà validé son score technique : "
                "ses notes ne sont plus modifiables."
            )
        if evaluateur and evaluation and evaluateur.evaluation_id != evaluation.id:
            raise serializers.ValidationError(
                "Cet évaluateur n'est pas rattaché à cette évaluation."
            )
        if critere and evaluation and critere.marche_id != evaluation.marche_id:
            raise serializers.ValidationError(
                "Le critère sélectionné n'appartient pas à l'AO de cette évaluation."
            )
        return attrs


class EvaluationFinanciereSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationFinanciere
        fields = [
            "id",
            "evaluation",
            "montant_lu",
            "corrections_arithmetiques",
            "rabais_accordes",
            "montant_evalue_final",
            "montant_moins_disant",
            "score_financier",
            "saisi_par_external_id",
            "saisi_par_label",
            "saisi_le",
        ]
        read_only_fields = [
            "montant_evalue_final",
            "score_financier",
            "saisi_par_external_id",
            "saisi_par_label",
            "saisi_le",
        ]

    def validate(self, attrs):
        evaluation = attrs.get("evaluation") or getattr(self.instance, "evaluation", None)
        if evaluation and not evaluation.financier_deverrouille:
            raise serializers.ValidationError(
                "Module financier verrouillé : le score technique doit d'abord être "
                "validé par le nombre requis d'évaluateurs (double aveugle)."
            )
        return attrs


class ScoreConsolideSerializer(serializers.ModelSerializer):
    soumissionnaire = serializers.CharField(
        source="evaluation.soumissionnaire.nom", read_only=True
    )

    class Meta:
        model = ScoreConsolide
        fields = [
            "id",
            "evaluation",
            "soumissionnaire",
            "score_technique",
            "score_financier",
            "poids_technique",
            "poids_financier",
            "score_total",
            "rang",
            "calcule_le",
        ]
        read_only_fields = fields


class EvaluationDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationDecision
        fields = [
            "id",
            "evaluation",
            "recommandation",
            "justification",
            "declaration_absence_conflit_interet",
            "decide_par_external_id",
            "decide_par_label",
            "decide_le",
        ]
        read_only_fields = [
            "decide_par_external_id",
            "decide_par_label",
            "decide_le",
        ]

    def validate(self, attrs):
        evaluation = attrs.get("evaluation") or getattr(self.instance, "evaluation", None)
        if evaluation and evaluation.statut == StatutEvaluation.CONSENSUS_REQUIS:
            raise serializers.ValidationError(
                "Conclusion impossible : un consensus est requis entre les "
                "évaluateurs (écart de score > seuil)."
            )
        return attrs


class AuditTrailSerializer(serializers.ModelSerializer):
    content_type_label = serializers.CharField(source="content_type.model", read_only=True)

    class Meta:
        model = AuditTrail
        fields = [
            "id",
            "content_type",
            "content_type_label",
            "object_id",
            "action",
            "old_value",
            "new_value",
            "external_user_id",
            "external_user_label",
            "timestamp",
        ]
        read_only_fields = fields


# --- Vue "dossier complet" en lecture pour une évaluation -----------------

class EvaluationHeaderDetailSerializer(EvaluationHeaderSerializer):
    examen_preliminaire = ExamenPreliminaireSerializer(read_only=True)
    evaluateurs = EvaluateurSerializer(many=True, read_only=True)
    evaluation_financiere = EvaluationFinanciereSerializer(read_only=True)
    score_consolide = ScoreConsolideSerializer(read_only=True)
    decision = EvaluationDecisionSerializer(read_only=True)

    class Meta(EvaluationHeaderSerializer.Meta):
        fields = EvaluationHeaderSerializer.Meta.fields + [
            "examen_preliminaire",
            "evaluateurs",
            "evaluation_financiere",
            "score_consolide",
            "decision",
        ]