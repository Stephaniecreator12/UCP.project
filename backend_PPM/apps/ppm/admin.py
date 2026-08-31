from django.contrib import admin
from unfold.admin import ModelAdmin
from apps.ppm.models.Travaux import Travaux
from apps.ppm.models.Biens import Biens
from apps.ppm.models.Consultances import Consultance


@admin.register(Travaux)
class TravauxAdmin(ModelAdmin):
    list_display = (
        "code_suivi", "intitule", "montant_estimatif", "agmo",
        "methode_pm", "statut", "date_signature_prevu", "date_signature_reel",
    )
    list_filter = ("statut", "methode_pm", "agmo")
    search_fields = ("code_suivi", "intitule", "commentaire")
    readonly_fields = (
        "date_lancement_prevu", "date_ouverture_prevu",
        "rapport_evaluation_prevu", "date_signature_prevu", "date_livraison_prevu",
        "dossiers_appel_prevu",
        "dossiers_appel_reel", "date_lancement_reel", "date_ouverture_reel",
        "rapport_evaluation_reel", "date_signature_reel", "date_livraison_reel",
    )
    list_per_page = 25
    date_hierarchy = "date_lancement_prevu"
    fieldsets = (
        ("Identification", {
            "fields": ("code_suivi", "intitule", "montant_estimatif", "statut"),
        }),
        ("Procédure", {
            "fields": ("agmo", "methode_pm", "approches", "revue"),
        }),
        ("Suivi", {
            "fields": ("listesetspecifications", "prevu", "reel", "commentaire", "duree"),
        }),
        ("Dates prévues", {
            "fields": (
                "dossiers_appel_prevu", "date_lancement_prevu", "date_ouverture_prevu",
                "rapport_evaluation_prevu", "date_signature_prevu", "date_livraison_prevu",
            ),
            "classes": ("collapse",),
        }),
        ("Dates réelles", {
            "fields": (
                "dossiers_appel_reel", "date_lancement_reel", "date_ouverture_reel",
                "rapport_evaluation_reel", "date_signature_reel", "date_livraison_reel",
            ),
            "classes": ("collapse",),
        }),
    )


@admin.register(Biens)
class BiensAdmin(ModelAdmin):
    list_display = (
        "code_suivi", "intitule", "montant_estimatif", "agmo",
        "methode_epm", "statut", "date_signature_prevu", "date_signature_reel",
    )
    list_filter = ("statut", "methode_epm", "agmo")
    search_fields = ("code_suivi", "intitule", "commentaire")
    readonly_fields = (
        "date_lancement_prevu", "date_ouverture_prevu",
        "rapport_evaluation_prevu", "date_signature_prevu", "date_livraison_prevu",
        "dossiers_appel_prevu",
        "dossiers_appel_reel", "date_lancement_reel", "date_ouverture_reel",
        "rapport_evaluation_reel", "date_signature_reel", "date_livraison_reel",
    )
    list_per_page = 25
    date_hierarchy = "date_lancement_prevu"
    fieldsets = (
        ("Identification", {
            "fields": ("code_suivi", "intitule", "montant_estimatif", "statut"),
        }),
        ("Procédure", {
            "fields": ("agmo", "methode_epm", "approches", "revue"),
        }),
        ("Suivi", {
            "fields": ("listesetspecifications", "prevu", "reel", "commentaire", "duree"),
        }),
        ("Dates prévues", {
            "fields": (
                "dossiers_appel_prevu", "date_lancement_prevu", "date_ouverture_prevu",
                "rapport_evaluation_prevu", "date_signature_prevu", "date_livraison_prevu",
            ),
            "classes": ("collapse",),
        }),
        ("Dates réelles", {
            "fields": (
                "dossiers_appel_reel", "date_lancement_reel", "date_ouverture_reel",
                "rapport_evaluation_reel", "date_signature_reel", "date_livraison_reel",
            ),
            "classes": ("collapse",),
        }),
    )


@admin.register(Consultance)
class ConsultanceAdmin(ModelAdmin):
    list_display = (
        "ref_code_suivi", "intitule", "montant_estimatif", "methode",
        "approche", "statut", "date_signature_prevu", "date_signature_reel",
    )
    list_filter = ("statut", "methode", "approche")
    search_fields = ("ref_code_suivi", "intitule", "commentaire")
    readonly_fields = (
        "TdR_prevu", "ami_prevu", "liste_restreinte_prevu",
        "demande_proposition_prevu", "date_invitation_prevu",
        "date_ouverture_prevu", "rapport_evaluation_prevu",
        "ouverture_plis_prevu", "projet_contrat_prevu",
        "date_signature_prevu", "date_fin_prevu",
        "TdR_reel", "ami_reel", "liste_restreinte_reel",
        "demande_proposition_reel", "date_invitation_reel",
        "date_ouverture_reel", "rapport_evaluation_reel",
        "ouverture_plis_reel", "projet_contrat_reel",
        "date_signature_reel", "date_fin_reel",
    )
    list_per_page = 25
    date_hierarchy = "date_signature_prevu"
    fieldsets = (
        ("Identification", {
            "fields": ("ref_code_suivi", "intitule", "montant_estimatif", "statut"),
        }),
        ("Procédure", {
            "fields": ("agmoxdirection", "methode", "approche", "revue", "forfaitxtemps"),
        }),
        ("Dates prévues", {
            "fields": (
                "TdR_prevu", "ami_prevu", "liste_restreinte_prevu",
                "demande_proposition_prevu", "date_invitation_prevu",
                "date_ouverture_prevu", "rapport_evaluation_prevu",
                "ouverture_plis_prevu", "projet_contrat_prevu",
                "date_signature_prevu", "date_fin_prevu", "duree",
            ),
            "classes": ("collapse",),
        }),
        ("Dates réelles", {
            "fields": (
                "TdR_reel", "ami_reel", "liste_restreinte_reel",
                "demande_proposition_reel", "date_invitation_reel",
                "date_ouverture_reel", "rapport_evaluation_reel",
                "ouverture_plis_reel", "projet_contrat_reel",
                "date_signature_reel", "date_fin_reel",
            ),
            "classes": ("collapse",),
        }),
        ("Commentaire", {
            "fields": ("commentaire",),
            "classes": ("collapse",),
        }),
    )
