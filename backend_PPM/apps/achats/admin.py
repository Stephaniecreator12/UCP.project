from django.contrib import admin
from unfold.admin import ModelAdmin

from apps.achats.models import (
    DemandeAchat,
    DocumentDemande,
    Fournisseur,
    HistoriqueDemande,
    LigneBesoin,
    ValidationDemande,
)


@admin.register(DemandeAchat)
class DemandeAchatAdmin(ModelAdmin):
    list_display = (
        "numero_demande",
        "objet",
        "type_demande",
        "statut",
        "etape_validation_actuelle",
        "priorite",
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
    readonly_fields = ("numero_demande", "created_at", "updated_at", "submitted_at")
    list_per_page = 25
    date_hierarchy = "created_at"
    fieldsets = (
        ("Identification", {
            "fields": ("numero_demande", "version", "demandeur", "created_at", "updated_at"),
        }),
        ("Demande", {
            "fields": (
                "objet", "justification", "categorie_besoin", "type_demande",
                "priorite", "unite_technique", "service_beneficiaire",
                "lien_ptba", "requires_tdr",
            ),
        }),
        ("Statut & Validation", {
            "fields": ("statut", "etape_validation_actuelle", "submitted_at"),
        }),
        ("Financement", {
            "fields": (
                "ligne_budgetaire", "source_financement", "numero_subvention",
                "solde_disponible_ligne_budgetaire", "numero_engagement_budgetaire",
                "solde_apres_engagement", "cout_total_estime",
            ),
            "classes": ("collapse",),
        }),
        ("Fournisseur & Commande", {
            "fields": (
                "type_procedure", "fournisseur", "fournisseur_retenu",
                "email_fournisseur", "numero_bon_commande", "date_bon_commande",
                "montant_commande",
            ),
            "classes": ("collapse",),
        }),
        ("Livraison", {
            "fields": (
                "delai_livraison_contractuel", "date_livraison_prevue",
                "conditions_livraison", "garantie",
                "date_arrivee_prevue", "date_arrivee_effective", "etat_expedition",
            ),
            "classes": ("collapse",),
        }),
        ("Réception", {
            "fields": (
                "date_reception", "receptionnaire", "conformite_quantite",
                "conformite_qualite", "observations_reception", "statut_reception",
            ),
            "classes": ("collapse",),
        }),
        ("Écart & Clôture", {
            "fields": (
                "type_ecart", "description_ecart", "action_corrective",
                "date_resolution", "suivi_resolution", "statut_final",
                "date_cloture", "niveau_satisfaction", "commentaires_finaux",
            ),
            "classes": ("collapse",),
        }),
    )


@admin.register(LigneBesoin)
class LigneBesoinAdmin(ModelAdmin):
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
    list_per_page = 25


@admin.register(DocumentDemande)
class DocumentDemandeAdmin(ModelAdmin):
    list_display = ("id", "demande", "type_document", "uploaded_at")
    list_filter = ("type_document",)
    search_fields = ("commentaire",)
    readonly_fields = ("uploaded_at",)
    list_per_page = 25


@admin.register(ValidationDemande)
class ValidationDemandeAdmin(ModelAdmin):
    list_display = ("id", "demande", "etape", "decision", "validateur", "created_at")
    list_filter = ("etape", "decision")
    search_fields = ("demande__numero_demande", "commentaire", "validateur__username")
    list_per_page = 25
    readonly_fields = ("created_at",)


@admin.register(HistoriqueDemande)
class HistoriqueDemandeAdmin(ModelAdmin):
    list_display = ("id", "demande", "action", "user", "created_at")
    list_filter = ("action",)
    search_fields = ("demande__numero_demande", "description", "user__username")
    list_per_page = 25
    readonly_fields = ("created_at",)


@admin.register(Fournisseur)
class FournisseurAdmin(ModelAdmin):
    list_display = ("id", "nom", "email", "telephone", "actif", "created_at")
    list_filter = ("actif",)
    search_fields = ("nom", "email", "telephone")
    list_per_page = 25
    readonly_fields = ("created_at", "updated_at")
