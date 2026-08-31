from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline, StackedInline

from .models import SeanceOuverture, MembreSeance, OffreOuverture, PVDocument


# ============================================================
# INLINES
# ============================================================
class MembreSeanceInline(TabularInline):
    model = MembreSeance
    extra = 0
    fields = (
        "utilisateur", "nom_prenom", "poste", "est_present",
        "a_valide", "decision", "date_validation",
    )
    readonly_fields = ("date_validation",)
    autocomplete_fields = ("utilisateur",)


class OffreOuvertureInline(TabularInline):
    model = OffreOuverture
    extra = 0
    fields = (
        "ordre_passage", "nom_soumissionnaire", "pli_existe",
        "enveloppe_administrative", "enveloppe_technique", "enveloppe_financiere",
        "montant_global", "lot_numero",
    )


class PVDocumentInline(StackedInline):
    model = PVDocument
    extra = 0
    max_num = 1
    fields = ("fichier", "version", "hash_document", "created_at")
    readonly_fields = ("hash_document", "created_at")


# ============================================================
# SEANCE D'OUVERTURE
# ============================================================
@admin.register(SeanceOuverture)
class SeanceOuvertureAdmin(ModelAdmin):
    list_display = (
        "reference_dossier", "objet_dossier", "category_type",
        "date_seance", "heure_seance", "lieu",
        "statut", "president_decision", "nb_offres",
    )
    list_filter = ("statut", "president_decision", "category_type", "date_seance")
    search_fields = ("reference_dossier", "objet_dossier")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "date_seance"
    inlines = [MembreSeanceInline, OffreOuvertureInline, PVDocumentInline]
    fieldsets = (
        ("Identification", {
            "fields": (
                "reference_dossier", "objet_dossier", "category_type",
                "date_seance", "heure_seance", "lieu",
            ),
        }),
        ("Observations", {
            "fields": ("observations",),
            "classes": ("collapse",),
        }),
        ("Secrétaire / Président", {
            "fields": ("secretaire", "president"),
        }),
        ("Statut", {
            "fields": (
                "statut", "president_a_valide", "president_decision",
                "president_commentaire", "date_validation_president",
            ),
        }),
        ("Étape / Scellés", {
            "fields": (
                "etape_ouverture", "etat_scelle",
                "presence_rature", "description_rature",
                "document_substitution_present",
            ),
            "classes": ("collapse",),
        }),
        ("Sécurité président", {
            "fields": (
                "president_ip_adresse", "president_navigateur",
                "president_validation_password_hash",
                "president_validation_password_generated_at",
                "president_validation_password_consumed_at",
            ),
            "classes": ("collapse",),
        }),
        ("Métadonnées", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
    autocomplete_fields = ("secretaire", "president")
    list_per_page = 25

    def nb_offres(self, obj):
        return obj.offres.count()
    nb_offres.short_description = "Offres"


# ============================================================
# MEMBRE DE SÉANCE
# ============================================================
@admin.register(MembreSeance)
class MembreSeanceAdmin(ModelAdmin):
    list_display = (
        "seance", "nom_prenom", "poste", "est_present",
        "a_valide", "decision", "date_validation",
    )
    list_filter = ("decision", "a_valide", "est_present", "seance")
    search_fields = (
        "nom_prenom", "seance__reference_dossier",
        "utilisateur__email", "numero_carte",
    )
    readonly_fields = ("date_validation",)
    autocomplete_fields = ("seance", "utilisateur")
    list_per_page = 25
    fieldsets = (
        ("Séance", {"fields": ("seance", "utilisateur")}),
        ("Informations", {
            "fields": ("nom_prenom", "numero_carte", "intitule", "poste"),
        }),
        ("Présence / Validation", {
            "fields": (
                "est_present", "a_valide", "decision",
                "commentaire", "date_validation",
            ),
        }),
        ("Sécurité", {
            "fields": (
                "ip_adresse", "navigateur",
                "validation_password_hash",
                "validation_password_generated_at",
                "validation_password_consumed_at",
            ),
            "classes": ("collapse",),
        }),
    )


# ============================================================
# OFFRE D'OUVERTURE
# ============================================================
@admin.register(OffreOuverture)
class OffreOuvertureAdmin(ModelAdmin):
    list_display = (
        "seance", "ordre_passage", "nom_soumissionnaire",
        "pli_existe", "enveloppe_administrative",
        "enveloppe_technique", "enveloppe_financiere",
        "montant_global", "lot_numero",
    )
    list_filter = (
        "pli_existe", "enveloppe_administrative",
        "enveloppe_technique", "enveloppe_financiere",
        "seance",
    )
    search_fields = (
        "nom_soumissionnaire", "seance__reference_dossier",
        "lot_numero", "nif_stat",
    )
    autocomplete_fields = ("seance",)
    list_per_page = 25
    fieldsets = (
        ("Séance", {"fields": ("seance", "ordre_passage")}),
        ("Soumissionnaire", {
            "fields": ("nom_soumissionnaire", "nif_stat", "lot_numero"),
        }),
        ("Pli", {
            "fields": (
                "pli_existe", "motif_absence_pli",
                "date_reception_pli", "heure_reception_pli",
            ),
        }),
        ("Enveloppes", {
            "fields": (
                "enveloppe_administrative", "enveloppe_technique",
                "enveloppe_financiere",
            ),
        }),
        ("Montants", {
            "fields": ("montant_global",),
        }),
        ("Observations", {
            "fields": ("observations",),
            "classes": ("collapse",),
        }),
    )


# ============================================================
# PV DOCUMENT
# ============================================================
@admin.register(PVDocument)
class PVDocumentAdmin(ModelAdmin):
    list_display = ("seance", "version", "hash_document", "fichier", "created_at")
    list_filter = ("created_at",)
    search_fields = ("seance__reference_dossier", "hash_document")
    readonly_fields = ("hash_document", "created_at")
    autocomplete_fields = ("seance",)
    list_per_page = 25
