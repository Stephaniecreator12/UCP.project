from rest_framework import serializers
from django.contrib.auth import get_user_model

from apps.ouverture_offre.models import OffreOuverture
from apps.evaluation_offre.models import (
    EvaluationOffre,
    ExamenPreliminaire,
    EvaluationTechnique,
    EvaluationFinanciere,
    EvaluationConclusion,
    DecisionFinale,
    DeclarationConflitType,
    RecommandationType,
)
from apps.evaluation_offre.services.evaluation_service import (
    _compute_consensus_info,
    _compute_evaluateurs_avancement,
    _compute_moins_disant,
    _compute_progress_status,
    _financial_gate,
    _technical_gate,
    compute_offre_statut_dashboard,
)

User = get_user_model()

COMMON_EMAIL_DOMAIN_FIXES = {
    "gail.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gmial.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gnail.com": "gmail.com",
    "gmail.con": "gmail.com",
    "yaho.com": "yahoo.com",
    "yahoo.con": "yahoo.com",
    "hotmai.com": "hotmail.com",
    "hotmial.com": "hotmail.com",
    "hotmail.con": "hotmail.com",
    "outlok.com": "outlook.com",
    "outllook.com": "outlook.com",
    "outlook.con": "outlook.com",
    "icloud.con": "icloud.com",
}

COMMON_COM_TLD_TYPOS = (".con", ".cim", ".cpm", ".copm", ".comm")


def get_email_typo_suggestion(email: str) -> str:
    value = (email or "").strip()
    if value.count("@") != 1:
        return ""

    local_part, domain = value.rsplit("@", 1)
    normalized_domain = domain.lower()
    suggested_domain = COMMON_EMAIL_DOMAIN_FIXES.get(normalized_domain)

    if not suggested_domain:
        for typo in COMMON_COM_TLD_TYPOS:
            if normalized_domain.endswith(typo):
                suggested_domain = f"{domain[:-len(typo)]}.com"
                break

    if not suggested_domain or suggested_domain.lower() == normalized_domain:
        return ""

    return f"{local_part}@{suggested_domain}"


def validate_email_typo(email: str) -> str:
    suggestion = get_email_typo_suggestion(email)
    if suggestion:
        raise serializers.ValidationError(
            "Adresse e-mail probablement mal saisie : "
            f"{email}. Voulez-vous dire {suggestion} ?"
        )
    return email


# ============================================================
# SERIALIZER UTILISATEUR (lecture seule, comme SimpleUserSerializer)
# ============================================================
class SimpleEvaluateurSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class OffreEvaluationSerializer(serializers.ModelSerializer):
    seance_id = serializers.IntegerField(source="seance.id", read_only=True)
    reference_dossier = serializers.CharField(
        source="seance.reference_dossier", read_only=True
    )
    objet_dossier = serializers.CharField(source="seance.objet_dossier", read_only=True)
    statut_seance = serializers.CharField(source="seance.statut", read_only=True)

    class Meta:
        model = OffreOuverture
        fields = [
            "id",
            "seance_id",
            "reference_dossier",
            "objet_dossier",
            "statut_seance",
            "ordre_passage",
            "nom_soumissionnaire",
            "montant_global",
            "observations",
            "lot_numero",
            "nif_stat",
        ]


# ============================================================
# SECTION 2 — EXAMEN PRÉLIMINAIRE
# ============================================================
class ExamenPreliminaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenPreliminaire
        fields = [
            "id",
            "offre_signee",
            "garantie_conforme",
            "dossier_admin_complet",
            "validite_conforme",
            "conditions_acceptees",
            "commentaire",
            "est_conforme",   # read_only : calculé auto dans le save()
        ]
        read_only_fields = ["est_conforme"]

    def validate(self, attrs):
        # Si tous les champs sont False, on avertit mais on n'empêche pas
        # (l'évaluateur peut sauvegarder en cours de route)
        return attrs


# ============================================================
# SECTION 3 — ÉVALUATION TECHNIQUE
# ============================================================
class EvaluationTechniqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationTechnique
        fields = [
            "id",
            "note_conformite_technique",   # /5
            "note_delai_livraison",         # /5
            "note_experience",              # /5
            "note_sav_garantie",            # /5
            "score_technique_total",        # calculé auto /100
            "qualifie_technique",           # calculé auto (≥70)
        ]
        read_only_fields = ["score_technique_total", "qualifie_technique"]

    def validate_note_conformite_technique(self, value):
        if value is not None and not (0 <= value <= 5):
            raise serializers.ValidationError("La note doit être entre 0 et 5.")
        return value

    def validate_note_delai_livraison(self, value):
        if value is not None and not (0 <= value <= 5):
            raise serializers.ValidationError("La note doit être entre 0 et 5.")
        return value

    def validate_note_experience(self, value):
        if value is not None and not (0 <= value <= 5):
            raise serializers.ValidationError("La note doit être entre 0 et 5.")
        return value

    def validate_note_sav_garantie(self, value):
        if value is not None and not (0 <= value <= 5):
            raise serializers.ValidationError("La note doit être entre 0 et 5.")
        return value

    def validate(self, attrs):
        return attrs


# ============================================================
# SECTION 4 — ÉVALUATION FINANCIÈRE
# ============================================================
class EvaluationFinanciereSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationFinanciere
        fields = [
            "id",
            "montant_lu",
            "corrections_arithmetiques",
            "rabais_accordes",
            "montant_evalue_final",    # calculé auto
            "offre_moins_disante",
            "score_financier",         # calculé auto
        ]
        read_only_fields = ["montant_evalue_final", "score_financier"]

    def validate_montant_lu(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Le montant doit être positif.")
        return value

    def validate(self, attrs):
        montant_lu = attrs.get("montant_lu")
        if montant_lu is not None:
            corrections = attrs.get("corrections_arithmetiques", 0) or 0
            rabais = attrs.get("rabais_accordes", 0) or 0
            if float(montant_lu) - float(corrections) - float(rabais) <= 0:
                raise serializers.ValidationError(
                    "Le montant évalué final doit être positif après corrections et rabais."
                )
        return attrs


class EvaluationConclusionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationConclusion
        fields = [
            "id",
            "recommandation",
            "justification",
            "declaration_conflit",
            "signe_le",
        ]
        read_only_fields = ["signe_le"]


class SaveExamenSerializer(serializers.Serializer):
    offre_signee = serializers.BooleanField(required=False, allow_null=True)
    garantie_conforme = serializers.BooleanField(required=False, allow_null=True)
    dossier_admin_complet = serializers.BooleanField(required=False, allow_null=True)
    validite_conforme = serializers.BooleanField(required=False, allow_null=True)
    conditions_acceptees = serializers.BooleanField(required=False, allow_null=True)
    commentaire = serializers.CharField(required=False, allow_blank=True)


class SaveTechniqueSerializer(serializers.Serializer):
    note_conformite_technique = serializers.DecimalField(
        max_digits=3, decimal_places=1, required=False, allow_null=True,
    )
    note_delai_livraison = serializers.DecimalField(
        max_digits=3, decimal_places=1, required=False, allow_null=True,
    )
    note_experience = serializers.DecimalField(
        max_digits=3, decimal_places=1, required=False, allow_null=True,
    )
    note_sav_garantie = serializers.DecimalField(
        max_digits=3, decimal_places=1, required=False, allow_null=True,
    )


class SaveFinanciereSerializer(serializers.Serializer):
    montant_lu = serializers.DecimalField(
        max_digits=18, decimal_places=2, required=False, allow_null=True,
    )
    corrections_arithmetiques = serializers.DecimalField(
        max_digits=18, decimal_places=2, required=False, allow_null=True,
    )
    rabais_accordes = serializers.DecimalField(
        max_digits=18, decimal_places=2, required=False, allow_null=True,
    )


class SaveConclusionSerializer(serializers.Serializer):
    recommandation = serializers.ChoiceField(
        choices=RecommandationType.choices, required=False, allow_null=True,
    )
    justification = serializers.CharField(required=False, allow_blank=True)
    declaration_conflit = serializers.ChoiceField(
        choices=DeclarationConflitType.choices, required=False, allow_blank=True,
    )
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)


class SaveEvaluationSerializer(serializers.Serializer):
    examen = SaveExamenSerializer(required=False)
    technique = SaveTechniqueSerializer(required=False)
    financiere = SaveFinanciereSerializer(required=False)
    conclusion = SaveConclusionSerializer(required=False)
    email = serializers.EmailField(required=False, allow_blank=True)
    code = serializers.CharField(required=False, allow_blank=True)


# ============================================================
# ÉVALUATION COMPLÈTE (lecture — pour afficher tout d'un coup)
# ============================================================
class EvaluationOffreDetailSerializer(serializers.ModelSerializer):
    evaluateur_detail      = SimpleEvaluateurSerializer(source="evaluateur", read_only=True)
    offre_detail           = OffreEvaluationSerializer(source="offre", read_only=True)
    examen_preliminaire    = ExamenPreliminaireSerializer(read_only=True)
    evaluation_technique   = EvaluationTechniqueSerializer(read_only=True)
    evaluation_financiere  = EvaluationFinanciereSerializer(read_only=True)
    conclusion             = EvaluationConclusionSerializer(read_only=True)
    decision_finale        = serializers.SerializerMethodField()
    peut_saisir_technique    = serializers.SerializerMethodField()
    blocage_technique        = serializers.SerializerMethodField()
    peut_saisir_financiere = serializers.SerializerMethodField()
    blocage_financier      = serializers.SerializerMethodField()
    evaluateurs_avancement = serializers.SerializerMethodField()
    score_final_individuel = serializers.SerializerMethodField()
    progression            = serializers.SerializerMethodField()
    consensus_alerte       = serializers.SerializerMethodField()
    consensus_ecart        = serializers.SerializerMethodField()
    moins_disant_calcule   = serializers.SerializerMethodField()
    evaluateurs_seance     = serializers.SerializerMethodField()

    class Meta:
        model = EvaluationOffre
        fields = [
            "id",
            "offre",
            "offre_detail",
            "evaluateur",
            "evaluateur_detail",
            "evaluateur_nom_prenom",
            "evaluateur_email",
            "evaluateur_entite",
            "evaluateur_poste",
            "evaluateur_numero_carte",
            "statut",
            "date_evaluation",
            "examen_preliminaire",
            "evaluation_technique",
            "evaluation_financiere",
            "conclusion",
            "decision_finale",
            "peut_saisir_technique",
            "blocage_technique",
            "peut_saisir_financiere",
            "blocage_financier",
            "evaluateurs_avancement",
            "score_final_individuel",
            "progression",
            "consensus_alerte",
            "consensus_ecart",
            "moins_disant_calcule",
            "evaluateurs_seance",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["statut", "date_evaluation", "created_at", "updated_at"]

    def get_peut_saisir_technique(self, obj):
        allowed, _message = _technical_gate(obj.offre)
        return allowed

    def get_blocage_technique(self, obj):
        _allowed, message = _technical_gate(obj.offre)
        return message

    def get_peut_saisir_financiere(self, obj):
        allowed, _message = _financial_gate(obj.offre)
        return allowed

    def get_blocage_financier(self, obj):
        _allowed, message = _financial_gate(obj.offre)
        return message

    def get_evaluateurs_avancement(self, obj):
        return _compute_evaluateurs_avancement(obj.offre)

    def get_progression(self, obj):
        return _compute_progress_status(obj)

    def get_consensus_alerte(self, obj):
        return _compute_consensus_info(obj.offre)["alerte"]

    def get_consensus_ecart(self, obj):
        return _compute_consensus_info(obj.offre)["ecart_max"]

    def get_moins_disant_calcule(self, obj):
        value = _compute_moins_disant(obj.offre.seance_id, obj.evaluateur)
        return str(value) if value is not None else None

    def get_evaluateurs_seance(self, obj):
        evaluations = (
            EvaluationOffre.objects
            .filter(offre__seance_id=obj.offre.seance_id)
            .order_by("evaluateur_id", "offre_id")
        )
        seen = set()
        result = []
        for evaluation in evaluations:
            if evaluation.evaluateur_id in seen:
                continue
            seen.add(evaluation.evaluateur_id)
            result.append({
                "nom": evaluation.evaluateur_nom_prenom,
                "email": evaluation.evaluateur_email,
                "entite": evaluation.evaluateur_entite,
            })
        return result[:3]

    def get_decision_finale(self, obj):
        try:
            decision = obj.offre.decision_finale
        except DecisionFinale.DoesNotExist:
            return None
        return DecisionFinaleSerializer(decision).data

    def get_score_final_individuel(self, obj):
        try:
            tech = obj.evaluation_technique
            fin = obj.evaluation_financiere
        except (EvaluationTechnique.DoesNotExist, EvaluationFinanciere.DoesNotExist):
            return None

        if tech.score_technique_total is None or fin.score_financier is None:
            return None

        return round(
            float(tech.score_technique_total) * 0.60
            + float(fin.score_financier) * 0.40,
            2,
        )


# ============================================================
# LISTE DES OFFRES À ÉVALUER (lecture simplifiée)
# ============================================================
class EvaluationOffreListSerializer(serializers.ModelSerializer):
    seance_id = serializers.IntegerField(source="offre.seance.id", read_only=True)
    nom_soumissionnaire = serializers.CharField(
        source="offre.nom_soumissionnaire", read_only=True
    )
    reference_dossier = serializers.CharField(
        source="offre.seance.reference_dossier", read_only=True
    )
    objet_dossier = serializers.CharField(
        source="offre.seance.objet_dossier", read_only=True
    )
    montant_global = serializers.DecimalField(
        source="offre.montant_global",
        max_digits=18,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = EvaluationOffre
        fields = [
            "id",
            "offre",
            "seance_id",
            "nom_soumissionnaire",
            "reference_dossier",
            "objet_dossier",
            "montant_global",
            "evaluateur_nom_prenom",
            "evaluateur_email",
            "evaluateur_entite",
            "evaluateur_poste",
            "evaluateur_numero_carte",
            "statut",
            "date_evaluation",
        ]


class EvaluateurAssigneSerializer(serializers.ModelSerializer):
    evaluateur_detail = SimpleEvaluateurSerializer(source="evaluateur", read_only=True)
    score_technique_total = serializers.SerializerMethodField()
    score_financier = serializers.SerializerMethodField()

    class Meta:
        model = EvaluationOffre
        fields = [
            "id",
            "evaluateur",
            "evaluateur_detail",
            "evaluateur_nom_prenom",
            "evaluateur_email",
            "evaluateur_entite",
            "evaluateur_poste",
            "evaluateur_numero_carte",
            "statut",
            "date_evaluation",
            "score_technique_total",
            "score_financier",
        ]

    def get_score_technique_total(self, obj):
        try:
            return obj.evaluation_technique.score_technique_total
        except EvaluationTechnique.DoesNotExist:
            return None

    def get_score_financier(self, obj):
        try:
            return obj.evaluation_financiere.score_financier
        except EvaluationFinanciere.DoesNotExist:
            return None


class OffreAssignationSerializer(serializers.ModelSerializer):
    offre_id = serializers.IntegerField(source="id", read_only=True)
    seance_id = serializers.IntegerField(source="seance.id", read_only=True)
    reference_dossier = serializers.CharField(
        source="seance.reference_dossier", read_only=True
    )
    objet_dossier = serializers.CharField(source="seance.objet_dossier", read_only=True)
    statut_seance = serializers.CharField(source="seance.statut", read_only=True)
    date_seance = serializers.DateField(source="seance.date_seance", read_only=True)
    evaluateurs_assignes = EvaluateurAssigneSerializer(
        source="evaluations",
        many=True,
        read_only=True,
    )
    statut_dashboard = serializers.SerializerMethodField()
    consensus_alerte = serializers.SerializerMethodField()

    class Meta:
        model = OffreOuverture
        fields = [
            "offre_id",
            "seance_id",
            "reference_dossier",
            "objet_dossier",
            "statut_seance",
            "date_seance",
            "ordre_passage",
            "nom_soumissionnaire",
            "montant_global",
            "observations",
            "lot_numero",
            "nif_stat",
            "evaluateurs_assignes",
            "statut_dashboard",
            "consensus_alerte",
        ]

    def get_statut_dashboard(self, obj):
        return compute_offre_statut_dashboard(obj)

    def get_consensus_alerte(self, obj):
        return _compute_consensus_info(obj)["alerte"]


# ============================================================
# ASSIGNATION DES ÉVALUATEURS (écriture)
# Supporte soit `evaluateur_ids` (3 ids existants) soit
# `commission_members` (3 objets avec nomPrenom/email/entite/poste/cin)
# ============================================================
class CommissionMemberSerializer(serializers.Serializer):
    nomPrenom = serializers.CharField()
    email = serializers.EmailField()
    entite = serializers.CharField()
    poste = serializers.CharField(allow_blank=True, required=False)
    role = serializers.CharField(allow_blank=True, required=False, write_only=True)
    cin = serializers.RegexField(
        regex=r"^\d{12}$",
        error_messages={"invalid": "Le CIN doit contenir exactement 12 chiffres."},
    )

    def validate_email(self, value):
        return validate_email_typo(value)

    def validate(self, attrs):
        poste = (attrs.get("poste") or attrs.get("role") or "").strip()
        if not poste:
            raise serializers.ValidationError({
                "poste": "Le rôle/poste de l'évaluateur est obligatoire."
            })
        attrs["poste"] = poste
        return attrs


class OffreAssignationMetaSerializer(serializers.Serializer):
    offre_id = serializers.IntegerField()
    lot_numero = serializers.CharField(required=False, allow_blank=True)
    nif_stat = serializers.CharField(required=False, allow_blank=True)


class AssignationEvaluateursSerializer(serializers.Serializer):
    evaluateur_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=3,
        max_length=3,
        required=False,
    )
    commission_members = serializers.ListField(
        child=CommissionMemberSerializer(),
        min_length=3,
        max_length=3,
        required=False,
    )
    offres = serializers.ListField(
        child=OffreAssignationMetaSerializer(),
        required=False,
    )
    lot_numero = serializers.CharField(required=False, allow_blank=True)
    nif_stat = serializers.CharField(required=False, allow_blank=True)
    nom_soumissionnaire = serializers.CharField(required=False, allow_blank=True)
    date_evaluation = serializers.DateField(required=False, allow_null=True)
    heure_evaluation = serializers.TimeField(required=False, allow_null=True)

    def validate(self, attrs):
        has_ids = bool(attrs.get("evaluateur_ids"))
        has_members = bool(attrs.get("commission_members"))
        if not (has_ids ^ has_members):
            raise serializers.ValidationError(
                "Fournir soit 'evaluateur_ids' soit 'commission_members' (exactement 3)."
            )

        if has_ids:
            value = attrs.get("evaluateur_ids")
            if len(set(value)) != 3:
                raise serializers.ValidationError(
                    "Les 3 évaluateurs doivent être des personnes différentes."
                )
            users = User.objects.filter(id__in=value, is_active=True)
            if users.count() != 3:
                raise serializers.ValidationError(
                    "Un ou plusieurs évaluateurs sont introuvables ou inactifs."
                )

        if has_members:
            members = attrs.get("commission_members")
            if len(members) != 3:
                raise serializers.ValidationError(
                    "Les 3 membres de la commission sont requis."
                )
            emails = [m.get("email", "").strip().lower() for m in members]
            if len(set(emails)) != 3:
                raise serializers.ValidationError(
                    "Les emails des membres doivent être distincts."
                )
            cins = [m.get("cin", "").strip() for m in members]
            if len(set(cins)) != 3:
                raise serializers.ValidationError(
                    "Les numéros de carte d'identité doivent être distincts."
                )

        return attrs


# ============================================================
# DÉCISION FINALE (écriture + lecture)
# ============================================================
class DecisionFinaleSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = DecisionFinale
        fields = [
            "id",
            "offre",
            "score_technique_consolide",   # calculé auto
            "score_financier_consolide",   # calculé auto
            "score_final",                 # calculé auto
            "classement",
            "recommandation",
            "justification",
            "declaration_conflit",
            "password",
            "created_at",
        ]
        read_only_fields = [
            "score_technique_consolide",
            "score_financier_consolide",
            "score_final",
            "created_at",
        ]

    def validate_recommandation(self, value):
        if not value:
            raise serializers.ValidationError("La recommandation est obligatoire.")
        return value

    def validate_declaration_conflit(self, value):
        if not value:
            raise serializers.ValidationError(
                "Vous devez déclarer l'absence de conflit d'intérêt."
            )
        return value

    def validate_password(self, value):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            raise serializers.ValidationError("Utilisateur non identifié.")
        if not user.check_password(value):
            raise serializers.ValidationError("Mot de passe incorrect.")
        return value
