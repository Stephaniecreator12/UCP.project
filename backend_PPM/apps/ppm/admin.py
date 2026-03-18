from django.contrib import admin
from apps.ppm.models.Travaux import Travaux
from apps.ppm.models.Biens import Biens
from apps.ppm.models.Consultances import Consultance

admin.site.register(Travaux)
admin.site.register(Biens)
admin.site.register(Consultance)
