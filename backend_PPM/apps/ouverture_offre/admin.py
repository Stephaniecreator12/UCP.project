from django.contrib import admin
from .models import SeanceOuverture, OffreOuverture, MembreSeance

admin.site.register(SeanceOuverture)
admin.site.register(OffreOuverture)
admin.site.register(MembreSeance)