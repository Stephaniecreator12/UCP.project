from django.urls import path
from apps.reception.services import ReceptionService  # Import du fichier de service créé précédemment

urlpatterns = [
    # Route pour enregistrer une nouvelle réception (Section 9 du canevas)
    path('reception/enregistrer/', ReceptionService.enregistrer_reception, name='enregistrer_reception'),
    
    # Route pour récupérer les détails d'une réception spécifique (Tratabilité - Section G)
    # path('reception/<int:id>/', ReceptionService.get_reception_detail, name='detail_reception'),
]