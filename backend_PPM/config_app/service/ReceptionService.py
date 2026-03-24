import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Reception, ReceptionItem, Ecart, DemandeAchat

@csrf_exempt
def enregistrer_reception_service(request):
    if request.method == 'POST':
        try:
            # Récupération des données du front-end
            data = json.loads(request.body)
            id_achat = data.get('achat_id')
            items_data = data.get('items', [])
            
            # 1. Création de l'entrée de réception principale
            reception = Reception.objects.create(
                achat_id=id_achat,
                numero_bc=data.get('numero_bc'),
                receptionnaire=data.get('receptionnaire'),
                statut_reception=data.get('statut_calcule'),
                observations_generales=data.get('observations')
            )

            # 2. Traitement ligne par ligne (Section 9.2) [cite: 107]
            for item in items_data:
                qte_cmd = item.get('qte_cmd')
                qte_recu = item.get('qte_recu')
                etat = item.get('etat')

                rec_item = ReceptionItem.objects.create(
                    reception=reception,
                    designation=item.get('designation'),
                    quantite_commandee=qte_cmd,
                    quantite_reçue=qte_recu,
                    etat_qualite=etat
                )

                # 3. Création automatique d'un écart si anomalie (Section 9.3) [cite: 109]
                if qte_recu < qte_cmd or etat != "Conforme":
                    Ecart.objects.create(
                        reception_item=rec_item,
                        type_ecart="Manquant" if qte_recu < qte_cmd else "Défectueux",
                        description_probleme=f"Écart constaté : {qte_recu}/{qte_cmd}",
                        action_corrective="À définir par la logistique"
                    )

            # 4. Mise à jour du statut global de la demande [cite: 77]
            achat = DemandeAchat.objects.get(id=id_achat)
            achat.statut = "Livré" if data.get('statut_calcule') == "Réceptionné complet" else "Réception partielle"
            achat.save()

            return JsonResponse({'status': 'success', 'reception_id': reception.id}, status=201)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'POST requis'}, status=405)