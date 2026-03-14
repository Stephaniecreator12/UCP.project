from django.contrib import admin
from .entity.Travaux import Travaux
from .entity.Biens import Biens
from .entity.Consultance import Consultance
from .entity.demande_achat import DemandeAchat

admin.site.register(Travaux)
admin.site.register(Biens)
admin.site.register(Consultance)
admin.site.register(DemandeAchat)
