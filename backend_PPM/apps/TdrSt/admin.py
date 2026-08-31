from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from apps.TdrSt.models.TdrSt import (
    TdrStDocument,
    TdrStDocumentFileVersion,
    TdrStValidationAction,
)


class TdrStDocumentFileVersionInline(TabularInline):
    model = TdrStDocumentFileVersion
    extra = 0
    fields = (
        "version", "fichier_pdf", "fichier_nom_original",
        "fichier_taille_octets", "empreinte_sha256",
        "uploaded_by", "uploaded_at",
    )
    readonly_fields = (
        "empreinte_sha256", "fichier_taille_octets", "uploaded_at",
    )


class TdrStValidationActionInline(TabularInline):
    model = TdrStValidationAction
    extra = 0
    fields = ("etape", "decision", "acteur", "observations", "horodatage")
    readonly_fields = ("horodatage",)


@admin.register(TdrStDocument)
class TdrStDocumentAdmin(ModelAdmin):
    list_display = (
        "numero_document", "type_document", "statut",
        "intitule", "categorie_activite",
        "demandeur", "version", "created_at",
    )
    list_filter = ("type_document", "statut", "categorie_activite", "created_at")
    search_fields = ("numero_document", "intitule", "reference_ptba")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"
    inlines = [TdrStDocumentFileVersionInline, TdrStValidationActionInline]
    autocomplete_fields = ("demandeur", "demande_achat")
    list_per_page = 25
    fieldsets = (
        ("Identification", {
            "fields": (
                "numero_document", "version", "type_document",
                "statut", "intitule",
            ),
        }),
        ("Classification", {
            "fields": (
                "categorie_activite", "unite_technique", "reference_ptba",
            ),
        }),
        ("Période", {
            "fields": ("periode_debut", "periode_fin", "duree_estimee_valeur", "duree_estimee_unite"),
        }),
        ("Financement", {
            "fields": (
                "sources_financement", "numero_subvention",
                "ligne_budgetaire", "montant_estime_usd",
            ),
        }),
        ("Passation", {
            "fields": ("seuil_passation", "procedure_envisagee"),
        }),
        ("Liens", {
            "fields": ("demandeur", "demande_achat"),
        }),
        ("Métadonnées", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


@admin.register(TdrStDocumentFileVersion)
class TdrStDocumentFileVersionAdmin(ModelAdmin):
    list_display = (
        "document", "version", "fichier_nom_original",
        "fichier_taille_octets", "uploaded_by", "uploaded_at",
    )
    list_filter = ("uploaded_at",)
    search_fields = (
        "document__numero_document", "fichier_nom_original",
        "empreinte_sha256",
    )
    readonly_fields = (
        "empreinte_sha256", "fichier_taille_octets", "uploaded_at",
    )
    autocomplete_fields = ("document", "uploaded_by")
    list_per_page = 25


@admin.register(TdrStValidationAction)
class TdrStValidationActionAdmin(ModelAdmin):
    list_display = (
        "document", "etape", "decision", "acteur", "horodatage",
    )
    list_filter = ("etape", "decision", "horodatage")
    search_fields = (
        "document__numero_document", "acteur__email", "observations",
    )
    readonly_fields = ("horodatage",)
    autocomplete_fields = ("document", "acteur")
    list_per_page = 25
