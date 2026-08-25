from django.contrib import admin

from .models.consultation import LogConsultation
from .models.download import LogDownload


@admin.register(LogConsultation)
class LogConsultationAdmin(admin.ModelAdmin):
    list_display = ("dossier", "user_id", "timestamp")
    list_filter = ("timestamp",)
    search_fields = (
        "dossier__reference_number", "dossier__title", "user_id",
    )
    readonly_fields = ("dossier", "user_id", "timestamp")
    date_hierarchy = "timestamp"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(LogDownload)
class LogDownloadAdmin(admin.ModelAdmin):
    list_display = ("dossier", "user_id", "doc_type", "annexe_name", "timestamp")
    list_filter = ("doc_type", "timestamp")
    search_fields = (
        "dossier__reference_number", "dossier__title",
        "user_id", "annexe_name",
    )
    readonly_fields = (
        "dossier", "user_id", "doc_type", "annexe_name", "timestamp",
    )
    date_hierarchy = "timestamp"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
