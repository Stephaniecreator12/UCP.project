from django.contrib import admin
from .models.validation import ValidationDemande
from .models.demande_achat import DemandeAchat

admin.site.register(ValidationDemande)
admin.site.register(DemandeAchat)