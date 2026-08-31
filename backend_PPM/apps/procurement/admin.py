from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline

from .models.procurement_market import ProcurementMarket
from .models.annex_document import AnnexDocument
from .models.technical_document import TechnicalDocument
from .models.atelier import DateAtelier


# ============================================================
# INLINES
# ============================================================
class AnnexDocumentInline(TabularInline):
    model = AnnexDocument
    extra = 0
    fields = ("file", "uploaded_at")
    readonly_fields = ("uploaded_at",)


class TechnicalDocumentInline(TabularInline):
    model = TechnicalDocument
    extra = 0
    fields = ("file", "version", "uploaded_at")
    readonly_fields = ("version", "uploaded_at")


class DateAtelierInline(TabularInline):
    model = DateAtelier
    extra = 0
    fields = ("dates_atelier",)


# ============================================================
# PROCUREMENT MARKET (DAO)
# ============================================================
@admin.register(ProcurementMarket)
class ProcurementMarketAdmin(ModelAdmin):
    list_display = (
        "reference_number", "title", "category",
        "procedure_type", "status",
        "publication_date", "deadline", "nb_annexes", "nb_tech_docs",
    )
    list_filter = ("status", "category", "procedure_type")
    search_fields = ("reference_number", "title")
    readonly_fields = ("reference_number", "created_at")
    date_hierarchy = "publication_date"
    inlines = [AnnexDocumentInline, TechnicalDocumentInline, DateAtelierInline]
    fieldsets = (
        ("Identification", {
            "fields": ("reference_number", "title"),
        }),
        ("Classification", {
            "fields": ("procedure_type", "category"),
        }),
        ("Financement", {
            "fields": ("financing_sources", "reference_bailleur", "project_code"),
        }),
        ("Dates", {
            "fields": ("publication_date", "deadline"),
        }),
        ("Document de soumission", {
            "fields": ("submission_model",),
        }),
        ("Statut", {
            "fields": ("status",),
        }),
        ("Métadonnées", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    def nb_annexes(self, obj):
        return obj.annexes.count()
    nb_annexes.short_description = "Annexes"

    def nb_tech_docs(self, obj):
        return obj.technical_documents.count()
    nb_tech_docs.short_description = "Docs tech"


# ============================================================
# ANNEXE
# ============================================================
@admin.register(AnnexDocument)
class AnnexDocumentAdmin(ModelAdmin):
    list_display = ("market", "file", "uploaded_at")
    list_filter = ("uploaded_at",)
    search_fields = ("market__reference_number", "market__title")
    readonly_fields = ("uploaded_at",)
    autocomplete_fields = ("market",)
    list_per_page = 25


# ============================================================
# DOCUMENT TECHNIQUE
# ============================================================
@admin.register(TechnicalDocument)
class TechnicalDocumentAdmin(ModelAdmin):
    list_display = ("market", "file", "version", "uploaded_at")
    list_filter = ("uploaded_at",)
    search_fields = ("market__reference_number", "market__title")
    readonly_fields = ("version", "uploaded_at")
    autocomplete_fields = ("market",)
    list_per_page = 25


# ============================================================
# DATE ATELIER
# ============================================================
@admin.register(DateAtelier)
class DateAtelierAdmin(ModelAdmin):
    list_display = ("market", "dates_atelier")
    list_filter = ("dates_atelier",)
    search_fields = ("market__reference_number", "market__title")
    autocomplete_fields = ("market",)
    list_per_page = 25
