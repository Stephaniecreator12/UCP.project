from django.contrib import admin
from .entity.Travaux import Travaux
from .entity.Biens import Biens
from .entity.BiensDetailsPrevu import BiensDetailsPrevu
from .entity.BiensDetailsReel import BiensDetailsReel
from .entity.Consultance import Consultance
from .entity.ConsultanceDetailsPrevu import ConsultanceDetailsPrevu
from .entity.ConsultanceDetailsReel import ConsultanceDetailsReel  
# Fais la même chose pour Biens et Consultance

admin.site.register(Travaux)
admin.site.register(Biens)
admin.site.register(BiensDetailsPrevu)
admin.site.register(BiensDetailsReel)
admin.site.register(Consultance)
admin.site.register(ConsultanceDetailsPrevu)
admin.site.register(ConsultanceDetailsReel)