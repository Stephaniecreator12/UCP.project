from django.contrib import admin
from unfold.admin import ModelAdmin

from apps.common.models import ReferenceChoice


@admin.register(ReferenceChoice)
class ReferenceChoiceAdmin(ModelAdmin):
    list_display = ("group", "code", "label", "sort_order", "is_active")
    list_filter = ("group", "is_active")
    list_editable = ("label", "sort_order", "is_active")
    search_fields = ("code", "label")
    ordering = ("group", "sort_order", "code")
    list_per_page = 100
