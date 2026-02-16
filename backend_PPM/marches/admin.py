from django.contrib import admin
from .entity.Travaux import Travaux
from .entity.Biens import Biens
from .entity.Consultance import Consultance
# Fais la même chose pour Biens et Consultance

admin.site.register(Travaux)
admin.site.register(Biens)
admin.site.register(Consultance)
