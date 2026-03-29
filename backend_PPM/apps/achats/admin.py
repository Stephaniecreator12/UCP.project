from django.contrib import admin

from apps.achats.models import DemandeAchat, DocumentDemande, LigneBesoin


@admin.register(DemandeAchat)
class DemandeAchatAdmin(admin.ModelAdmin):
    list_display = ("id", "numero_demande", "objet", "type_demande", "statut", "created_at")
    list_filter = ("statut", "type_demande", "priorite", "source_financement")
    search_fields = ("numero_demande", "objet", "unite_technique", "service_beneficiaire")


@admin.register(LigneBesoin)
class LigneBesoinAdmin(admin.ModelAdmin):
    list_display = ("id", "demande", "ordre", "designation", "type_service", "cout_total_estime")
    list_filter = ("type_service",)
    search_fields = ("designation", "marque_modele", "description_service")


@admin.register(DocumentDemande)
class DocumentDemandeAdmin(admin.ModelAdmin):
    list_display = ("id", "demande", "type_document", "uploaded_at")
    list_filter = ("type_document",)
    search_fields = ("commentaire",)
