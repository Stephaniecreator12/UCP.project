from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Contrat, EcheancierPaiement, DocumentContrat, AuditTrailContrat


@admin.register(Contrat)
class ContratAdmin(ModelAdmin):
    list_display = [
        "numero_marche",
        "statut",
        "nom_prestataire",
        "montant_ttc",
        "created_at",
    ]
    list_filter = ["statut", "created_at"]
    search_fields = ["numero_marche", "nom_prestataire", "email_prestataire"]
    readonly_fields = ["numero_marche", "created_at", "updated_at", "created_by"]
    fieldsets = (
        ("Général", {
            "fields": ("numero_marche", "statut", "seance", "offre_gagnante", "created_by")
        }),
        ("Prestataire", {
            "fields": (
                "nom_prestataire",
                "email_prestataire",
                "telephone_prestataire",
                "nif_prestataire",
                "stat_prestataire",
                "representant_signataire",
            )
        }),
        ("Contrat", {
            "fields": ("montant_ttc", "date_signature", "duree_execution", "clauses_particulieres")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
    list_per_page = 25


@admin.register(EcheancierPaiement)
class EcheancierPaiementAdmin(ModelAdmin):
    list_display = ["contrat", "pourcentage", "montant", "etape", "date_prevue", "statut"]
    list_filter = ["statut", "date_prevue"]
    search_fields = ["contrat__numero_marche", "etape"]
    list_per_page = 25
    readonly_fields = ("created_at", "updated_at")


@admin.register(DocumentContrat)
class DocumentContratAdmin(ModelAdmin):
    list_display = ["contrat", "type_document", "date_upload", "uploaded_by"]
    list_filter = ["type_document", "date_upload"]
    search_fields = ["contrat__numero_marche"]
    readonly_fields = ["hash_sha256", "date_upload"]
    list_per_page = 25
    date_hierarchy = "date_upload"


@admin.register(AuditTrailContrat)
class AuditTrailContratAdmin(ModelAdmin):
    list_display = ["contrat", "action", "utilisateur", "timestamp"]
    list_filter = ["action", "timestamp"]
    search_fields = ["contrat__numero_marche", "utilisateur__username"]
    readonly_fields = [
        "contrat",
        "action",
        "utilisateur",
        "timestamp",
        "description",
        "ancienne_valeur",
        "nouvelle_valeur",
        "champ_modifie",
        "ip_adresse",
        "navigateur",
    ]
    date_hierarchy = "timestamp"

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    list_per_page = 25
