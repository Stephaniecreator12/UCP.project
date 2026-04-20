from django.contrib import admin

from apps.achats.models import (
    DemandeAchat,
    DocumentDemande,
    HistoriqueDemande,
    LigneBesoin,
    ValidationDemande,
)


@admin.register(DemandeAchat)
class DemandeAchatAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "numero_demande",
        "objet",
        "type_demande",
        "statut",
        "etape_validation_actuelle",
        "numero_bon_commande",
        "created_at",
    )
    list_filter = ("statut", "type_demande", "priorite", "source_financement")
    search_fields = (
        "numero_demande",
        "objet",
        "unite_technique",
        "service_beneficiaire",
        "numero_bon_commande",
        "fournisseur_retenu",
        "email_fournisseur",
    )


@admin.register(LigneBesoin)
class LigneBesoinAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "demande",
        "ordre",
        "designation",
        "type_service",
        "cout_total_estime",
        "quantite_recue",
    )
    list_filter = ("type_service",)
    search_fields = ("designation", "marque_modele", "description_service")


@admin.register(DocumentDemande)
class DocumentDemandeAdmin(admin.ModelAdmin):
    list_display = ("id", "demande", "type_document", "uploaded_at")
    list_filter = ("type_document",)
    search_fields = ("commentaire",)


@admin.register(ValidationDemande)
class ValidationDemandeAdmin(admin.ModelAdmin):
    list_display = ("id", "demande", "etape", "decision", "validateur", "created_at")
    list_filter = ("etape", "decision")
    search_fields = ("demande__numero_demande", "commentaire", "validateur__username")


@admin.register(HistoriqueDemande)
class HistoriqueDemandeAdmin(admin.ModelAdmin):
    list_display = ("id", "demande", "action", "user", "created_at")
    list_filter = ("action",)
    search_fields = ("demande__numero_demande", "description", "user__username")
