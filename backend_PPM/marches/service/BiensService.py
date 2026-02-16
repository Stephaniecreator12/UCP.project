import json
from django.http import JsonResponse
from ..entity.Biens import Biens
from datetime import datetime, timedelta
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@csrf_exempt
def insert_mock_biens(request):
    if request.method == 'POST':
        try:
            request_data = json.loads(request.body)
            
            # 1. Définition des valeurs par défaut pour éviter les répétitions .get()
            # On met ici tout ce qui est constant ou optionnel
            data = {
                'code_suivi': 'Code Suivi par défaut',
                'montant_estimatif': 1000000.00,
                'agmo': 'Direction Générale',
                'methode_epm': 'Appel d\'offres',
                'approches': 'Approche 1',
                'revue': 'Revue préalable',
                'prevu': 'Prévu',
                'reel': 'Réel',
                'commentaire': 'Remarque par défaut',
                'listesetspecifications': '2026-01-01',
                'dossiers_appel_prevu': '2026-01-01',
                'date_lancement_prevu': '2026-01-01',
                'date_ouverture_prevu': '2026-01-01',
                'rapport_evaluation_prevu': '2026-01-01',
                'date_signature_prevu': '2026-01-01',
                'date_livraison_prevu': '2026-01-01',
                'dossiers_appel_reel': '2026-01-01',
                'date_lancement_reel': '2026-01-01',
                'date_ouverture_reel': '2026-01-01',
                'rapport_evaluation_reel': '2026-01-01',
                'date_signature_reel': '2026-01-01',
                'date_livraison_reel': '2026-01-01',
            }

            # 2. On écrase les valeurs par défaut par les données réelles reçues du Front-end
            data.update(request_data)

            # 3. Création de l'objet en une seule ligne grâce au dépaquetage de dictionnaire (**)
            biens = Biens.objects.create(**data)

            return JsonResponse({'status': 'success', 'id': biens.id}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'POST request required'}, status=405)


def lister_biens(request):
    # .values() récupère automatiquement tous les champs de la table
    # et les transforme en dictionnaire (id, intitule, date_lancement_prevu, etc.)
    biens_data = list(Biens.objects.values())
    
    return JsonResponse({'biens': biens_data})


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculer_planning_biens(request):
    try:
        data = json.loads(request.body)
        
        # Récupération des données
        date_livr_str = data.get('date_livr')
        methode = data.get('methode', 'AOI').upper() # On force en majuscule pour éviter les erreurs
        duree = int(data.get('duree', 60))
        
        if not date_livr_str:
            return JsonResponse({'error': 'La date de livraison est obligatoire'}, status=400)

        date_livr = datetime.strptime(date_livr_str, '%Y-%m-%d')
        date_signature = date_livr - timedelta(days=duree)

        # Configuration des délais par méthode
        # Format: (jours_pour_tdr, jours_ami, jours_demande, jours_rapport, jours_ouverture, jours_projet)
        configs = {
            'AON':  (133, 28, 77, 91, 98, 119),
            'AOI': (133, 28, 70, 84, 91, 112),
            'DC':  (70, 7, 20, 30, 35, 49),
            'ED':  (70, 7, 20, 30, 35, 49)
        }

        if methode not in configs:
            return JsonResponse({'error': f"Méthode '{methode}' non supportée"}, status=400)

        # Extraction des délais selon la méthode choisie
        tdr_offset, ami_off, dem_off, rapp_off, ouv_off, proj_off = configs[methode]

        # Calcul du point de départ (TdR)
        tdr = date_signature - timedelta(days=tdr_offset)

        # Génération du dictionnaire de réponse
        dates = {
            'dossiers_appel_prevu': tdr.strftime('%Y-%m-%d'),
            'date_lancement_prevu': (tdr + timedelta(days=ami_off)).strftime('%Y-%m-%d'),
            'date_ouverture_prevu': (tdr + timedelta(days=dem_off)).strftime('%Y-%m-%d'),
            'rapport_evaluation_prevu': (tdr + timedelta(days=rapp_off)).strftime('%Y-%m-%d'),
            'date_signature_prevu': date_signature.strftime('%Y-%m-%d'),
            'date_livraison_prevu': date_livr.strftime('%Y-%m-%d')
        }
        
        return JsonResponse(dates)

    except ValueError:
        return JsonResponse({'error': 'Format de date invalide (attendu: YYYY-MM-DD)'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Erreur de calcul: {str(e)}"}, status=500)
