from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from apps.reception.models import Reception , ReceptionItem, Ecart # Supposant ces modèles existants

@csrf_exempt
def enregistrer_reception(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            bc_id = data.get('purchase_order_id')
            items_recus = data.get('items', [])
            
            # 1. Création de la réception principale (Section 9.2)
            reception = Reception.objects.create(
                purchase_order_id=bc_id,
                receptionnaire=data.get('receptionnaire'),
                date_reception=data.get('date_reception'),
                statut_reception=data.get('statut_final'), # "Complet" ou "Partiel"
                observations=data.get('observations')
            )

            # 2. Boucle sur les articles pour vérifier les écarts (Section 9.3)
            for item in items_recus:
                qty_commandee = item.get('quantite_commandee')
                qty_reçue = item.get('quantite_reçue')

                # Enregistrement de la ligne reçue
                line = ReceptionItem.objects.create(
                    reception=reception,
                    designation=item.get('designation'),
                    quantite_reçue=qty_reçue,
                    conformite_qualite=item.get('conformite_qualite')
                )

                # Gestion automatique des écarts si quantité insuffisante ou défectueuse
                if qty_reçue < qty_commandee or item.get('conformite_qualite') == 'Défectueux':
                    Ecart.objects.create(
                        reception_item=line,
                        type_ecart="Manquant" if qty_reçue < qty_commandee else "Défectueux",
                        description_ecart=f"Reçu {qty_reçue} sur {qty_commandee} commandés",
                        action_corrective="En attente de remplacement"
                    )

            return JsonResponse({'status': 'success', 'message': 'Réception enregistrée'}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)