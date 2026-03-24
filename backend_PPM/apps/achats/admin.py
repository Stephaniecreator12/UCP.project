from django.contrib import admin

from apps.achats.models import DemandeAchat, ValidationDemande, WorkflowHistory


@admin.register(DemandeAchat)
class DemandeAchatAdmin(admin.ModelAdmin):
    list_display = (
        "numero_demande",
        "service_demandeur",
        "statut",
        "demandeur",
        "date_demande",
    )
    list_filter = ("statut", "type_marche", "urgent")
    search_fields = ("numero_demande", "objet_demande", "service_demandeur")


@admin.register(ValidationDemande)
class ValidationDemandeAdmin(admin.ModelAdmin):
    list_display = ("demande", "role", "statut", "validateur", "date_validation")
    list_filter = ("role", "statut")
    search_fields = ("demande__numero_demande", "commentaire")


@admin.register(WorkflowHistory)
class WorkflowHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "demande",
        "action",
        "old_status",
        "new_status",
        "user",
        "created_at",
    )
    list_filter = ("action",)
    search_fields = ("demande__numero_demande", "commentaire")
