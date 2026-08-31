from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from unfold.admin import ModelAdmin, TabularInline
from .models import (
    EvaluationSeanceAssignation,
    EvaluationOffre,
    ExamenPreliminaire,
    EvaluationTechnique,
    NoteTechniqueCritere,
    EvaluationFinanciere,
    EvaluationConclusion,
    DecisionFinale,
    AuditTrail,
    CritereTechnique,
    CritereTemplate,
    EvaluationReport,
)
from .services.validation_access_service import issue_seance_password


def reactivate_passwords(modeladmin, request, queryset):
    """Réactive les mots de passe expirés"""
    for obj in queryset:
        issue_seance_password(obj)
    modeladmin.message_user(request, f"✅ {queryset.count()} mot(s) de passe réactivé(s)")


reactivate_passwords.short_description = "🔄 Réactiver les mots de passe"


def revoke_passwords(modeladmin, request, queryset):
    """Révoque les mots de passe sélectionnés"""
    count = 0
    for obj in queryset:
        obj.evaluation_password_hash = ""
        obj.evaluation_password_revoked_at = timezone.now()
        obj.save(update_fields=["evaluation_password_hash", "evaluation_password_revoked_at"])
        count += 1
    modeladmin.message_user(request, f"🚫 {count} mot(s) de passe révoqué(s)")


revoke_passwords.short_description = "🚫 Révoquer les mots de passe"


@admin.register(EvaluationSeanceAssignation)
class EvaluationSeanceAssignationAdmin(ModelAdmin):
    list_display = ('evaluateur_email', 'seance', 'password_status', 'evaluation_password_generated_at')
    list_filter = ('evaluation_password_revoked_at', 'evaluation_password_generated_at')
    search_fields = ('evaluateur_email',)
    readonly_fields = ('evaluation_password_generated_at', 'evaluation_password_hash')
    actions = [reactivate_passwords, revoke_passwords]
    list_per_page = 25

    def password_status(self, obj):
        if obj.evaluation_password_revoked_at:
            return format_html(
                '<span class="ucp-badge ucp-badge--danger">Expiré ({})</span>',
                obj.evaluation_password_revoked_at.strftime('%d/%m/%Y')
            )
        elif obj.evaluation_password_hash:
            return format_html(
                '<span class="ucp-badge ucp-badge--green">Actif</span>'
            )
        else:
            return format_html(
                '<span class="ucp-badge ucp-badge--amber">Pas de mot de passe</span>'
            )

    password_status.short_description = "Statut du mot de passe"


@admin.register(EvaluationOffre)
class EvaluationOffreAdmin(ModelAdmin):
    list_display = ('offre', 'evaluateur_email', 'password_status', 'statut')
    list_filter = ('statut', 'evaluation_password_consumed_at')
    search_fields = ('offre__id', 'evaluateur_email')
    readonly_fields = ('evaluation_password_hash',)
    list_per_page = 25

    def password_status(self, obj):
        if obj.evaluation_password_consumed_at:
            return format_html(
                '<span class="ucp-badge ucp-badge--blue">Utilisé ({})</span>',
                obj.evaluation_password_consumed_at.strftime('%d/%m/%Y')
            )
        elif obj.evaluation_password_hash:
            return format_html(
                '<span class="ucp-badge ucp-badge--green">En attente</span>'
            )
        else:
            return format_html(
                '<span class="ucp-badge ucp-badge--amber">Pas de mot de passe</span>'
            )

    password_status.short_description = "Statut du mot de passe"


@admin.register(ExamenPreliminaire)
class ExamenPreliminaireAdmin(ModelAdmin):
    list_display = ('evaluation', 'offre_signee', 'garantie_conforme', 'dossier_admin_complet', 'validite_conforme', 'conditions_acceptees', 'est_conforme')
    list_filter = ('est_conforme',)
    search_fields = ('evaluation__offre__id', 'evaluation__evaluateur_email')
    readonly_fields = ('est_conforme',)
    list_per_page = 25
    fieldsets = (
        ('Examen préliminaire', {
            'fields': ('evaluation', 'offre_signee', 'garantie_conforme', 'dossier_admin_complet', 'validite_conforme', 'conditions_acceptees', 'est_conforme')
        }),
    )


class NoteTechniqueCritereInline(TabularInline):
    model = NoteTechniqueCritere
    extra = 0
    fields = ('critere', 'note', 'commentaire')
    readonly_fields = ('critere',)
    ordering = ('critere__ordre', 'critere__nom')

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(EvaluationTechnique)
class EvaluationTechniqueAdmin(ModelAdmin):
    list_display = ('evaluation', 'score_technique_total', 'qualifie_technique', 'afficher_notes')
    list_filter = ('qualifie_technique',)
    search_fields = ('evaluation__offre__id', 'evaluation__evaluateur_email')
    readonly_fields = ('score_technique_total', 'qualifie_technique', 'created_at', 'updated_at')
    inlines = [NoteTechniqueCritereInline]
    list_per_page = 25

    def afficher_notes(self, obj):
        notes = obj.notes_criteres.select_related('critere').all()
        if not notes:
            return "—"
        items = []
        for n in notes:
            items.append(
                f'<span style="display:block;line-height:1.4;">'
                f'{n.critere.nom}: <b>{n.note}/5</b> '
                f'<span style="color:#627080;font-size:11px;">(poids: {n.critere.ponderation}%)</span>'
                f'</span>'
            )
        return format_html("".join(items))
    afficher_notes.short_description = "Notes par critère"


@admin.register(NoteTechniqueCritere)
class NoteTechniqueCritereAdmin(ModelAdmin):
    list_display = ('evaluation_technique', 'critere', 'note', 'commentaire')
    list_filter = ('critere__seance', 'critere')
    search_fields = ('evaluation_technique__evaluation__offre__id', 'critere__nom')
    list_editable = ('note',)
    ordering = ('evaluation_technique', 'critere__ordre')
    list_per_page = 25


@admin.register(EvaluationFinanciere)
class EvaluationFinanciereAdmin(ModelAdmin):
    list_display = ('evaluation', 'montant_lu', 'corrections_arithmetiques', 'rabais_accordes', 'montant_evalue_final', 'offre_moins_disante', 'score_financier')
    search_fields = ('evaluation__offre__id', 'evaluation__evaluateur_email')
    readonly_fields = ('montant_evalue_final', 'score_financier')
    list_per_page = 25
    fieldsets = (
        ('Montants', {
            'fields': ('evaluation', 'montant_lu', 'corrections_arithmetiques', 'rabais_accordes', 'montant_evalue_final')
        }),
        ('Comparaison', {
            'fields': ('offre_moins_disante', 'score_financier'),
            'classes': ('collapse',),
        }),
    )


@admin.register(EvaluationConclusion)
class EvaluationConclusionAdmin(ModelAdmin):
    list_display = ('evaluation', 'recommandation', 'declaration_conflit', 'signe_le')
    list_filter = ('recommandation', 'declaration_conflit')
    search_fields = ('evaluation__offre__id', 'evaluation__evaluateur_email')
    readonly_fields = ('signe_le',)
    list_per_page = 25
    fieldsets = (
        ('Conclusion', {
            'fields': ('evaluation', 'recommandation', 'declaration_conflit', 'signe_le')
        }),
    )


@admin.register(DecisionFinale)
class DecisionFinaleAdmin(ModelAdmin):
    list_display = ('offre', 'score_technique_consolide', 'score_financier_consolide', 'score_final', 'classement', 'recommandation')
    list_filter = ('recommandation',)
    search_fields = ('offre__id',)
    readonly_fields = ('score_final', 'created_at')
    list_per_page = 25
    fieldsets = (
        ('Scores consolidés', {
            'fields': ('score_technique_consolide', 'score_financier_consolide', 'score_final')
        }),
        ('Décision', {
            'fields': ('classement', 'recommandation', 'justification', 'declaration_conflit')
        }),
        ('Métadonnées', {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )


@admin.register(AuditTrail)
class AuditTrailAdmin(ModelAdmin):
    list_display = ('utilisateur', 'table_modifiee', 'id_enregistrement', 'action', 'champ_modifie', 'timestamp')
    list_filter = ('action', 'table_modifiee', 'timestamp')
    search_fields = ('utilisateur__email', 'table_modifiee', 'champ_modifie')
    readonly_fields = ('utilisateur', 'table_modifiee', 'id_enregistrement', 'action', 'champ_modifie', 'ancienne_valeur', 'nouvelle_valeur', 'timestamp')
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'
    fieldsets = (
        ('Action', {
            'fields': ('utilisateur', 'action', 'table_modifiee', 'id_enregistrement', 'timestamp')
        }),
        ('Détails', {
            'fields': ('champ_modifie', 'ancienne_valeur', 'nouvelle_valeur'),
            'classes': ('collapse',),
        }),
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    list_per_page = 25


@admin.register(CritereTemplate)
class CritereTemplateAdmin(ModelAdmin):
    list_display = ('category_type', 'nom', 'ponderation', 'ordre', 'actif', 'description_courte')
    list_filter = ('category_type', 'actif')
    search_fields = ('nom', 'description')
    list_editable = ('nom', 'ponderation', 'ordre', 'actif')
    ordering = ('category_type', 'ordre', 'nom')
    list_per_page = 25
    fieldsets = (
        ('Catégorie', {'fields': ('category_type',)}),
        ('Critère', {'fields': ('nom', 'description', 'ponderation', 'ordre', 'actif')}),
    )

    def description_courte(self, obj):
        if obj.description:
            return obj.description[:50] + ("..." if len(obj.description) > 50 else "")
        return "—"
    description_courte.short_description = "Description"

    actions = ['creer_criteres_pour_toutes_categories']

    def creer_criteres_pour_toutes_categories(self, request, queryset):
        """Crée des templates par défaut pour toutes les catégories vides."""
        from apps.procurement.models.procurement_market import CategoryType
        created = 0
        for cat_code, cat_label in CategoryType.choices:
            existing = queryset.filter(category_type=cat_code).count()
            if existing == 0:
                templates_defauts = _templates_par_categorie(cat_code)
                for t in templates_defauts:
                    CritereTemplate.objects.get_or_create(
                        category_type=cat_code,
                        nom=t["nom"],
                        defaults=t,
                    )
                    created += 1
        self.message_user(request, f"✅ {created} modèle(s) de critère(s) créé(s)")

    creer_criteres_pour_toutes_categories.short_description = "🔧 Initialiser les modèles par catégorie"


def _templates_par_categorie(category_type):
    """Retourne les templates par défaut pour une catégorie donnée."""
    from decimal import Decimal
    defaults = {
        "BIENS": [
            {"nom": "Conformité technique", "ponderation": Decimal("40.00"), "ordre": 1,
             "description": "Conformité de l'offre aux spécifications techniques du dossier"},
            {"nom": "Délai de livraison", "ponderation": Decimal("25.00"), "ordre": 2,
             "description": "Respect des délais de livraison proposés"},
            {"nom": "Expérience marchés similaires", "ponderation": Decimal("20.00"), "ordre": 3,
             "description": "Expérience du soumissionnaire dans des marchés comparables"},
            {"nom": "SAV, garantie, formation", "ponderation": Decimal("15.00"), "ordre": 4,
             "description": "Qualité du SAV, garanties et formations prévues"},
        ],
        "SERVICES": [
            {"nom": "Conformité technique", "ponderation": Decimal("35.00"), "ordre": 1,
             "description": "Conformité de l'offre aux termes de référence"},
            {"nom": "Délai d'exécution", "ponderation": Decimal("20.00"), "ordre": 2,
             "description": "Respect des délais d'exécution proposés"},
            {"nom": "Expérience et références", "ponderation": Decimal("30.00"), "ordre": 3,
             "description": "Expérience et références dans des missions similaires"},
            {"nom": "Qualité de l'équipe", "ponderation": Decimal("15.00"), "ordre": 4,
             "description": "Qualification et disponibilité de l'équipe proposée"},
        ],
        "INFRA": [
            {"nom": "Conformité technique", "ponderation": Decimal("25.00"), "ordre": 1,
             "description": "Conformité du dossier technique aux specifications"},
            {"nom": "Sécurité et sécurité au travail", "ponderation": Decimal("20.00"), "ordre": 2,
             "description": "Plan de sécurité et mesures de protection"},
            {"nom": "Délai d'exécution", "ponderation": Decimal("25.00"), "ordre": 3,
             "description": "Respect du calendrier de travaux"},
            {"nom": "Expérience travaux similaires", "ponderation": Decimal("20.00"), "ordre": 4,
             "description": "Références dans des travaux de même nature et complexité"},
            {"nom": "Moyens matériels et humains", "ponderation": Decimal("10.00"), "ordre": 5,
             "description": "Adéquation des moyens engagés"},
        ],
    }
    return defaults.get(category_type, defaults["BIENS"])


@admin.register(CritereTechnique)
class CritereTechniqueAdmin(ModelAdmin):
    list_display = ('seance', 'nom', 'ponderation', 'ordre', 'actif', 'description_courte')
    list_filter = ('seance', 'actif')
    search_fields = ('nom', 'seance__reference_dossier', 'description')
    list_editable = ('nom', 'ponderation', 'ordre', 'actif')
    ordering = ('seance', 'ordre', 'nom')
    list_per_page = 25
    fieldsets = (
        ('Séance', {'fields': ('seance',)}),
        ('Critère', {'fields': ('nom', 'description', 'ponderation', 'ordre', 'actif')}),
    )

    def description_courte(self, obj):
        if obj.description:
            return obj.description[:50] + ("..." if len(obj.description) > 50 else "")
        return "—"
    description_courte.short_description = "Description"

    actions = ['creer_criteres_defauts']

    def creer_criteres_defauts(self, request, queryset):
        count = 0
        for seance in queryset.values_list('seance', flat=True).distinct():
            from apps.ouverture_offre.models import SeanceOuverture
            s = SeanceOuverture.objects.get(pk=seance)
            CritereTechnique.creer_defauts_pour_seance(s)
            count += 1
        self.message_user(request, f"✅ Critères créés pour {count} séance(s) (basés sur les modèles de catégorie)")

    creer_criteres_defauts.short_description = "🔧 Créer critères à partir des modèles de catégorie"


# ============================================================
# RAPPORT D'ÉVALUATION (PDF généré)
# ============================================================
@admin.register(EvaluationReport)
class EvaluationReportAdmin(ModelAdmin):
    list_display = ("decision", "version", "hash_document", "fichier", "created_at")
    list_filter = ("created_at",)
    search_fields = (
        "decision__offre__nom_soumissionnaire",
        "decision__offre__seance__reference_dossier",
        "hash_document",
    )
    readonly_fields = ("hash_document", "created_at")
    autocomplete_fields = ("decision",)
    list_per_page = 25
    date_hierarchy = "created_at"
    fieldsets = (
        ('Rapport', {
            'fields': ('decision', 'version', 'fichier', 'hash_document')
        }),
        ('Métadonnées', {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )