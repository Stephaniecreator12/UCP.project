from django.contrib import admin
from django.contrib.auth.models import Group, Permission
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count

from .config import GROUP_DEFINITIONS, CATEGORIES
from django.contrib.auth import get_user_model

User = get_user_model()
admin.site.unregister(Group)

def _get_group_config(name):
    for g in GROUP_DEFINITIONS:
        if g["name"] == name:
            return g
    return None


class GroupUserInline(admin.TabularInline):
    model = User.groups.through
    extra = 0
    verbose_name = "Utilisateur"
    verbose_name_plural = "Utilisateurs membres"
    autocomplete_fields = ["userprofile"]

    def has_add_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return True


@admin.register(Group)
class CustomGroupAdmin(BaseGroupAdmin):
    list_display = [
        "name",
        "category_tag",
        "user_count",
        "permission_count",
        "config_status",
    ]
    list_filter = []
    search_fields = ["name"]
    ordering = ["name"]
    filter_horizontal = ["permissions"]
    inlines = [GroupUserInline]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _user_count=Count("user"),
            _permission_count=Count("permissions"),
        )

    def user_count(self, obj):
        url = reverse("admin:auth_group_change", args=[obj.pk])
        return format_html(
            '<a href="{}#/tab/inline/0">{}</a>',
            url,
            getattr(obj, "_user_count", obj.user_set.count()),
        )
    user_count.short_description = "Utilisateurs"
    user_count.admin_order_field = "_user_count"

    def permission_count(self, obj):
        return getattr(obj, "_permission_count", obj.permissions.count())
    permission_count.short_description = "Permissions"
    permission_count.admin_order_field = "_permission_count"

    def category_tag(self, obj):
        config = _get_group_config(obj.name)
        if config:
            category = config["category"]
            label = CATEGORIES.get(category, category)
            colors = {
                "admin": "#dc2626",
                "public": "#6b7280",
                "demandeur": "#3b82f6",
                "validateur": "#8b5cf6",
                "finance": "#10b981",
                "achat": "#f59e0b",
                "marche": "#ef4444",
                "ouverture_offre": "#ec4899",
                "contractualisation": "#14b8a6",
                "evaluation": "#f97316",
                "audit": "#6366f1",
            }
            color = colors.get(category, "#6b7280")
            return format_html(
                '<span style="background-color: {}; color: white; '
                'padding: 2px 8px; border-radius: 10px; font-size: 11px;">{}</span>',
                color,
                label,
            )
        return format_html(
            '<span style="color: #999;">—</span>'
        )
    category_tag.short_description = "Catégorie"

    def config_status(self, obj):
        config = _get_group_config(obj.name)
        if config:
            configured_perms = set()
            for app_label, models in config.get("permissions", {}).items():
                for model_name, actions in models.items():
                    for action in actions:
                        configured_perms.add(f"{action}_{model_name}")
            actual_perms = set(obj.permissions.values_list("codename", flat=True))
            if configured_perms == actual_perms:
                return format_html(
                    '<span style="color: #10b981;">✓</span>'
                )
            missing = configured_perms - actual_perms
            extra = actual_perms - configured_perms
            parts = []
            if missing:
                parts.append(f"manquantes: {', '.join(sorted(missing))}")
            if extra:
                parts.append(f"supplémentaires: {', '.join(sorted(extra))}")
            return format_html(
                '<span style="color: #f59e0b;">⚠ {}</span>',
                "; ".join(parts),
            )
        return format_html(
            '<span style="color: #6b7280;">Non configuré</span>'
        )
    config_status.short_description = "Permissions"

    def get_readonly_fields(self, request, obj=None):
        if obj and _get_group_config(obj.name):
            return ["name"]
        return []

    class Media:
        css = {"all": ("admin/css/group_admin.css",)}
