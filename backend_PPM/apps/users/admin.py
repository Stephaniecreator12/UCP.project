from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin

from apps.users.forms import (
    UserProfileCreationForm,
    UserProfileChangeForm,
)
from apps.users.models.user import UserProfile
from apps.users.models.agent import Programme, Poste, AgentProfile


@admin.register(UserProfile)
class UserProfileAdmin(BaseUserAdmin):
    add_form = UserProfileCreationForm
    form = UserProfileChangeForm
    model = UserProfile

    list_display = (
        "id",
        "email",
        "full_name",
        "type_entite",
        "is_staff",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_staff",
        "is_superuser",
        "is_active",
        "type_entite",
        "groups",
    )

    ordering = ("email",)

    search_fields = (
        "email",
        "full_name",
        "nif",
    )

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "email",
                    "password",
                )
            },
        ),
        (
            "Informations",
            {
                "fields": (
                    "full_name",
                    "phone",
                    "type_entite",
                    "nif",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Dates importantes",
            {
                "fields": (
                    "last_login",
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "full_name",
                    "phone",
                    "type_entite",
                    "nif",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_active",
                    "groups",
                ),
            },
        ),
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "last_login",
    )

    filter_horizontal = (
        "groups",
        "user_permissions",
    )
    list_per_page = 25


@admin.register(Programme)
class ProgrammeAdmin(ModelAdmin):
    list_display = ("id", "nom", "code")
    search_fields = ("nom", "code")
    list_per_page = 25


@admin.register(Poste)
class PosteAdmin(ModelAdmin):
    list_display = ("id", "nom", "programme")
    list_filter = ("programme",)
    search_fields = ("nom",)
    filter_horizontal = ("groups", "superieurs")
    list_per_page = 25


@admin.register(AgentProfile)
class AgentProfileAdmin(ModelAdmin):
    list_display = (
        "id",
        "user",
        "poste",
        "matricule",
        "service",
        "created_at",
    )
    list_filter = ("poste__programme", "poste")
    search_fields = (
        "user__email",
        "user__full_name",
        "matricule",
    )
    list_per_page = 25
    readonly_fields = ("created_at", "updated_at")