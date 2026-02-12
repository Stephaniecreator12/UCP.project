import json
from django.http import JsonResponse
from ..entity.Travaux import Travaux
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def insert_mock_travaux(request):
    if request.method == 'POST':
        try:
            requestBody = json.loads(request.body)
            print("Received body:", requestBody) # Debug print

            # mampiditra anle travaux any anaty base de données
            travaux = Travaux.objects.create(
                code_suivi=requestBody.get('code_suivi', 'Code Suivi par défaut'),
                intitule=requestBody.get('intitule'),
                montant_estimatif=requestBody.get('montant_estimatif', 1000000.00),
                agmo=requestBody.get('agmo', 'Direction Générale'),
                methode_pm=requestBody.get('methode_pm', 'Appel d\'offres'),
                approches=requestBody.get('approches', 'Approche 1'),
                revue=requestBody.get('revue', 'Revue préalable'),
                prevu=requestBody.get('prevu', 'Prévu'),
                listesetspecifications=requestBody.get('listesetspecifications', '2026-01-01'),
                dossiers_appel_prevu=requestBody.get('dossiers_appel_prevu', '2026-01-01'),
                date_lancement_prevu=requestBody.get('date_lancement_prevu', '2026-01-01'),
                date_ouverture_prevu=requestBody.get('date_ouverture_prevu', '2026-01-01'),
                rapport_evaluation_prevu=requestBody.get('rapport_evaluation_prevu', '2026-01-01'),
                date_signature_prevu=requestBody.get('date_signature_prevu', '2026-01-01'),
                date_livraison_prevu=requestBody.get('date_livraison_prevu', '2026-01-01'),
                commentaire=requestBody.get('commentaire', 'Remarque par défaut'),             
                # reel=requestBody.get('reel', 'Réel'), # Non existant dans le modèle
                dossiers_appel_reel=requestBody.get('dossiers_appel_reel', '2026-01-01'),
                date_lancement_reel=requestBody.get('date_lancement_reel', '2026-01-01'),
                date_ouverture_reel=requestBody.get('date_ouverture_reel', '2026-01-01'),
                rapport_evaluation_reel=requestBody.get('rapport_evaluation_reel', '2026-01-01'),
                date_signature_reel=requestBody.get('date_signature_reel', '2026-01-01'),
                date_livraison_reel=requestBody.get('date_livraison_reel', '2026-01-01'),
            )

            return JsonResponse({'status': 'success', 'id': travaux.id})
        except Exception as e:
            import traceback
            traceback.print_exc() # Print full stack trace to terminal
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'POST request required'}, status=400)


def lister_travaux(request):
    travaux_list = Travaux.objects.all()
    data = []
    for travaux in travaux_list:
        data.append({
            'id': travaux.id,
            'code_suivi': travaux.code_suivi,
            'intitule': travaux.intitule,
            'montant_estimatif': str(travaux.montant_estimatif),
            'agmo': travaux.agmo,
            'methode_pm': travaux.methode_pm,
            'approches': travaux.approches,
            'revue': travaux.revue,
            'listesetspecifications': travaux.listesetspecifications,
            'prevu': travaux.prevu,
            'dossiers_appel_prevu': travaux.dossiers_appel_prevu,
            'date_lancement_prevu': travaux.date_lancement_prevu,
            'date_ouverture_prevu': travaux.date_ouverture_prevu,
            'rapport_evaluation_prevu': travaux.rapport_evaluation_prevu,
            'date_signature_prevu': travaux.date_signature_prevu,
            'date_livraison_prevu': travaux.date_livraison_prevu,
            'reel': travaux.reel,
            'dossiers_appel_reel': travaux.dossiers_appel_reel,
            'date_lancement_reel': travaux.date_lancement_reel,
            'date_ouverture_reel': travaux.date_ouverture_reel,
            'rapport_evaluation_reel': travaux.rapport_evaluation_reel,
            'date_signature_reel': travaux.date_signature_reel,
            'date_livraison_reel': travaux.date_livraison_reel,
            'commentaire': travaux.commentaire
        })
    return JsonResponse({'travaux': data})


from datetime import datetime, timedelta
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@csrf_exempt
@api_view(['POST'])
# @permission_classes([IsAuthenticated]) # Désactivé pour permettre le calcul sans login complexe
def calculer_planning_travaux(request):
    try:
        data = json.loads(request.body)
        print("DEBUG CALCUL - Reçu:", data) # DEBUG
        
        # Récupération des données
        date_fin_str = data.get('date_fin')
        methode = data.get('methode', 'AOI').upper() # On force en majuscule pour éviter les erreurs
        duree = int(data.get('duree', 60))
        
        print(f"DEBUG VARS - Date: {date_fin_str}, Méthode: {methode}, Durée: {duree}")

        if not date_fin_str:
            return JsonResponse({'error': 'La date de fin est obligatoire'}, status=400)

        date_fin = datetime.strptime(date_fin_str, '%Y-%m-%d')
        date_signature = date_fin - timedelta(days=duree)

        # Configuration des délais par méthode
        # Format: (jours_pour_tdr, jours_ami, jours_demande, jours_rapport, jours_ouverture, jours_projet)
        configs = {
            'AON':  (133, 28, 77, 91, 98, 119),
            'AOI': (133, 28, 70, 84, 91, 112),
            'DC':  (70, 7, 20, 30, 35, 49),
            'ED':  (0, 0, 0, 0, 0, 0)
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
            'date_livraison_prevu': date_fin.strftime('%Y-%m-%d')
        }
        
        return JsonResponse(dates)

    except ValueError:
        return JsonResponse({'error': 'Format de date invalide (attendu: YYYY-MM-DD)'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Erreur de calcul: {str(e)}"}, status=500)

