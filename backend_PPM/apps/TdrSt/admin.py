from django.contrib import admin

from apps.TdrSt.models.TdrSt import TdrStDocument


@admin.register(TdrStDocument)
class TdrStDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "numero_document", "type_document", "statut", "version", "created_at")
    search_fields = ("numero_document", "intitule", "reference_ptba")
    list_filter = ("type_document", "statut", "created_at")

