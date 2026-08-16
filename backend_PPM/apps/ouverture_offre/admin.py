from django.contrib import admin
from .models import (
    SeanceOuverture,
    MembreSeance,
    OffreOuverture,
    PVDocument,
    ValidationCompositionMembre,
)


@admin.register(SeanceOuverture)
class SeanceOuvertureAdmin(admin.ModelAdmin):
    list_display = [
        "reference_dossier",
        "statut",
        "date_seance",
        "secretaire",
        "president",
        "created_at",
    ]
    list_filter = ["statut", "date_seance", "created_at"]
    search_fields = ["reference_dossier", "objet_dossier"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("Infos Séance", {
            "fields": (
                "reference_dossier",
                "objet_dossier",
                "date_seance",
                "heure_seance",
                "lieu",
                "observations",
            ),
        }),
        ("Acteurs", {
            "fields": ("secretaire", "president"),
        }),
        ("État", {
            "fields": ("statut", "membres_verrouilles", "date_soumission_membres"),
        }),
        ("Validation Président", {
            "fields": (
                "president_a_valide",
                "president_decision",
                "president_commentaire",
                "date_validation_president",
            ),
        }),
        ("Ouverture des plis", {
            "fields": (
                "etape_ouverture",
                "etat_scelle",
                "presence_rature",
                "description_rature",
                "document_substitution_present",
            ),
        }),
        ("Métadonnées", {
            "fields": ("created_at", "updated_at"),
        }),
    )


@admin.register(MembreSeance)
class MembreSeanceAdmin(admin.ModelAdmin):
    list_display = [
        "nom_prenom",
        "seance",
        "poste",
        "est_present",
        "a_valide",
        "decision",
    ]
    list_filter = ["est_present", "a_valide", "decision"]
    search_fields = ["nom_prenom", "seance__reference_dossier"]
    fieldsets = (
        ("Infos Membre", {
            "fields": (
                "seance",
                "utilisateur",
                "nom_prenom",
                "numero_carte",
                "poste",
                "intitule",
            ),
        }),
        ("Présence & Validation", {
            "fields": (
                "est_present",
                "a_valide",
                "decision",
                "commentaire",
                "date_validation",
            ),
        }),
        ("Technique", {
            "fields": ("ip_adresse", "navigateur"),
        }),
    )


@admin.register(OffreOuverture)
class OffreOuvertureAdmin(admin.ModelAdmin):
    list_display = [
        "ordre_passage",
        "nom_soumissionnaire",
        "seance",
        "montant_global",
        "eliminee_examen",
    ]
    list_filter = ["eliminee_examen", "consensus_technique_valide", "pli_existe"]
    search_fields = ["nom_soumissionnaire", "seance__reference_dossier"]
    fieldsets = (
        ("Séance & Ordre", {
            "fields": ("seance", "ordre_passage"),
        }),
        ("Soumissionnaire", {
            "fields": (
                "nom_soumissionnaire",
                "lot_numero",
                "nif_stat",
                "montant_global",
            ),
        }),
        ("Plis & Enveloppes", {
            "fields": (
                "pli_existe",
                "motif_absence_pli",
                "date_reception_pli",
                "heure_reception_pli",
                "enveloppe_administrative",
                "enveloppe_technique",
                "enveloppe_financiere",
            ),
        }),
        ("État des plis", {
            "fields": (
                "etat_scelle",
                "presence_rature",
                "description_rature",
                "document_substitution_present",
            ),
        }),
        ("Évaluation", {
            "fields": (
                "eliminee_examen",
                "consensus_technique_valide",
            ),
        }),
        ("Observations", {
            "fields": ("observations",),
        }),
    )


@admin.register(PVDocument)
class PVDocumentAdmin(admin.ModelAdmin):
    list_display = [
        "seance",
        "version",
        "created_at",
        "hash_document",
    ]
    list_filter = ["version", "created_at"]
    search_fields = ["seance__reference_dossier", "hash_document"]
    readonly_fields = ["created_at", "hash_document"]


@admin.register(ValidationCompositionMembre)
class ValidationCompositionMembreAdmin(admin.ModelAdmin):
    list_display = [
        "seance",
        "role",
        "decision",
        "validateur",
        "date_validation",
    ]
    list_filter = ["role", "decision", "date_validation"]
    search_fields = ["seance__reference_dossier", "validateur__username"]
    fieldsets = (
        ("Validation", {
            "fields": (
                "seance",
                "role",
                "validateur",
            ),
        }),
        ("Décision", {
            "fields": (
                "decision",
                "commentaire",
                "date_validation",
            ),
        }),
        ("Notification", {
            "fields": ("notification_sent_at",),
        }),
    )
