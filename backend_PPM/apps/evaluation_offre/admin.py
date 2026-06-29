from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models.evaluation_offre import EvaluationSeanceAssignation, EvaluationOffre
from .services.validation_access_service import issue_seance_password

def reactivate_passwords(modeladmin, request, queryset):
    """Réactive les mots de passe expirés"""
    for obj in queryset:
        issue_seance_password(obj)
    modeladmin.message_user(request, f"✅ {queryset.count()} mot(s) de passe réactivé(s)")

reactivate_passwords.short_description = "🔄 Réactiver les mots de passe"

def revoke_passwords(modeladmin, request, queryset):
    """Révoque les mots de passe sélectionnés"""
    count = 0
    for obj in queryset:
        obj.evaluation_password_hash = ""
        obj.evaluation_password_revoked_at = timezone.now()
        obj.save(update_fields=["evaluation_password_hash", "evaluation_password_revoked_at"])
        count += 1
    modeladmin.message_user(request, f"🚫 {count} mot(s) de passe révoqué(s)")

revoke_passwords.short_description = "🚫 Révoquer les mots de passe"

@admin.register(EvaluationSeanceAssignation)
class EvaluationSeanceAssignationAdmin(admin.ModelAdmin):
    list_display = ('evaluateur_email', 'seance', 'password_status', 'evaluation_password_generated_at')
    list_filter = ('evaluation_password_revoked_at', 'evaluation_password_generated_at')
    search_fields = ('evaluateur_email',)
    readonly_fields = ('evaluation_password_generated_at', 'evaluation_password_hash')
    actions = [reactivate_passwords, revoke_passwords]
    
    def password_status(self, obj):
        """Affiche le statut du mot de passe avec couleur"""
        if obj.evaluation_password_revoked_at:
            return format_html(
                '<span style="color: red; font-weight: bold;">❌ Expiré ({}) </span>',
                obj.evaluation_password_revoked_at.strftime('%d/%m/%Y')
            )
        elif obj.evaluation_password_hash:
            return format_html(
                '<span style="color: green; font-weight: bold;">✅ Actif</span>'
            )
        else:
            return format_html(
                '<span style="color: orange; font-weight: bold;">⚠️ Pas de mot de passe</span>'
            )
    
    password_status.short_description = "Statut du mot de passe"

@admin.register(EvaluationOffre)
class EvaluationOffreAdmin(admin.ModelAdmin):
    list_display = ('offre', 'evaluateur_email', 'password_status', 'statut')
    list_filter = ('statut', 'evaluation_password_consumed_at')
    search_fields = ('offre__id', 'evaluateur_email')
    readonly_fields = ('evaluation_password_hash',)
    
    def password_status(self, obj):
        """Affiche le statut du mot de passe avec couleur"""
        if obj.evaluation_password_consumed_at:
            return format_html(
                '<span style="color: blue; font-weight: bold;">✅ Utilisé ({}) </span>',
                obj.evaluation_password_consumed_at.strftime('%d/%m/%Y')
            )
        elif obj.evaluation_password_hash:
            return format_html(
                '<span style="color: green; font-weight: bold;">🔑 En attente</span>'
            )
        else:
            return format_html(
                '<span style="color: orange; font-weight: bold;">⚠️ Pas de mot de passe</span>'
            )
    
    password_status.short_description = "Statut du mot de passe"
