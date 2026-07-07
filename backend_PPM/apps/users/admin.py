from django.contrib import admin
from apps.users.models.public import PublicProfile
from apps.users.models.agent import Programme, Poste, AgentProfile


@admin.register(PublicProfile)
class PublicProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "full_name", "type_entite", "is_active", "created_at")
    list_filter = ("type_entite", "is_active")
    search_fields = ("email", "full_name", "nif")


@admin.register(Programme)
class ProgrammeAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "code")
    search_fields = ("nom", "code")


@admin.register(Poste)
class PosteAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "programme")
    list_filter = ("programme",)
    search_fields = ("nom",)
    filter_horizontal = ("groups", "superieurs")


@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "poste", "matricule", "service", "created_at")
    list_filter = ("poste__programme", "poste")
    search_fields = ("user__email", "user__first_name", "user__last_name", "matricule")
