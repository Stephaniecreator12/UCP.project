import json
from django.http import JsonResponse
from ..entity.Consultance import Consultance
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@csrf_exempt
def insert_mock_consultance(request):
    if request.method == 'POST':
        try:
            request_data = json.loads(request.body)
            
            # Valeurs par défaut regroupées
            data = {
                'ref_code_suivi': 'Code Suivi par défaut',
                'agmoxdirection': 'Direction Générale',
                'montant_estimatif': 1000000.00,
                'methode': 'Appel d\'offres',
                'approche': 'Approche 1',
                'revue': 'Revue préalable',
                'forfaitxtemps': 'Forfait',
                # Initialisation des dates par défaut (Prévu et Réel)
                'TdR_prevu': '2026-01-01', 
                'ami_prevu': '2026-01-01',
                'liste_restreinte_prevu': '2026-01-01',
                'demande_proposition_prevu': '2026-01-01',
                'date_invitation_prevu': '2026-01-01',
                'date_ouverture_prevu': '2026-01-01',
                'rapport_evaluation_prevu': '2026-01-01',
                'ouverture_plis_prevu': '2026-01-01',
                'projet_contrat_prevu': '2026-01-01',
                'date_signature_prevu': '2026-01-01',
                'date_fin_prevu': '2026-01-01',
                'TdR_reel': None,
                'ami_reel': None, 
                'liste_restreinte_reel': None,
                'demande_proposition_reel': None,
                'date_invitation_reel': None,
                'date_ouverture_reel': None,
                'rapport_evaluation_reel': None,
                'ouverture_plis_reel': None,
                'projet_contrat_reel': None,
                'date_signature_reel': None,
                'date_fin_reel': None,
                'commentaire': 'Remarque par défaut'
            }
            
            data.update(request_data)
            consultance = Consultance.objects.create(**data)
            
            return JsonResponse({'status': 'success', 'id': consultance.id}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

def lister_consultance(request):
    # Récupère tout d'un coup sous forme de dictionnaire
    data = list(Consultance.objects.values())
    return JsonResponse({'consultance': data})

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculer_planning_consultance(request):
    try:
        data = json.loads(request.body)
        
        # Récupération des données
        date_fin_str = data.get('date_fin')
        methode = data.get('methode', 'SMC').upper() # On force en majuscule pour éviter les erreurs
        duree = int(data.get('duree', 60))
        
        if not date_fin_str:
            return JsonResponse({'error': 'La date de fin est obligatoire'}, status=400)

        date_fin = datetime.strptime(date_fin_str, '%Y-%m-%d')
        date_signature = date_fin - timedelta(days=duree)

        # Configuration des délais par méthode
        # Format: (jours_pour_tdr, jours_ami, jours_demande, jours_rapport, jours_ouverture, jours_projet)
        configs = {
            'SMC':  (133, 28, 77, 91, 98, 119),
            'SFQC': (133, 28, 70, 84, 91, 112),
            'SQC':  (70, 7, 20, 30, 35, 49),
            'SED':  (70, 7, 20, 30, 35, 49),
            'SCI':  (70, 7, 20, 30, 35, 49)
        }

        if methode not in configs:
            return JsonResponse({'error': f"Méthode '{methode}' non supportée"}, status=400)

        # Extraction des délais selon la méthode choisie
        tdr_offset, ami_off, dem_off, rapp_off, ouv_off, proj_off = configs[methode]

        # Calcul du point de départ (TdR)
        tdr = date_signature - timedelta(days=tdr_offset)

        # Génération du dictionnaire de réponse
        dates = {
            'TdR_prevu': tdr.strftime('%Y-%m-%d'),
            'ami_prevu': (tdr + timedelta(days=ami_off)).strftime('%Y-%m-%d'),
            'demande_proposition_prevu': (tdr + timedelta(days=dem_off)).strftime('%Y-%m-%d'),
            'date_ouverture_prevu': (tdr + timedelta(days=dem_off)).strftime('%Y-%m-%d'), # Même jour que demande selon ton code
            'rapport_evaluation_prevu': (tdr + timedelta(days=rapp_off)).strftime('%Y-%m-%d'),
            'ouverture_plis_prevu': (tdr + timedelta(days=ouv_off)).strftime('%Y-%m-%d'),
            'projet_contrat_prevu': (tdr + timedelta(days=proj_off)).strftime('%Y-%m-%d'),
            'date_signature_prevu': date_signature.strftime('%Y-%m-%d'),
            'date_fin_prevu': date_fin.strftime('%Y-%m-%d')
        }
        
        return JsonResponse(dates)

    except ValueError:
        return JsonResponse({'error': 'Format de date invalide (attendu: YYYY-MM-DD)'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Erreur de calcul: {str(e)}"}, status=500)
