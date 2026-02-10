import json
from django.http import JsonResponse
from ..entity.Biens import Biens
from ..entity.BiensDetailsPrevu import BiensDetailsPrevu
from ..entity.BiensDetailsReel import BiensDetailsReel
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def insert_mock_biens(request):
    if request.method == 'POST':
        requestBody = json.loads(request.body)

        # mampiditra anle biens any anaty base de données
        biens = Biens.objects.create(
            code_suivi=requestBody.get('code_suivi', 'Code Suivi par défaut'),
            intitule=requestBody.get('intitule'),
            montant_estimatif=requestBody.get('montant_estimatif', 1000000.00),
            agmo=requestBody.get('agmo', 'Direction Générale'),
            methode_epm=requestBody.get('methode_epm', 'Appel d\'offres'),
            approches=requestBody.get('approches', 'Approche 1'),
            revue=requestBody.get('revue', 'Revue préalable')
        )

        biens_details_prevu = BiensDetailsPrevu.objects.create(
            prevu=requestBody.get('detail_prevuxreel', 'Prévu'),
            biens=biens,
            listesetspecifications=requestBody.get('detail_listesetspecifications', '2026-01-01'),
            dossiers_appel=requestBody.get('detail_dossiers_appel', '2026-01-01'),
            date_lancement=requestBody.get('detail_date_lancement', '2026-01-01'),
            date_ouverture=requestBody.get('detail_date_ouverture', '2026-01-01'),
            rapport_evaluation=requestBody.get('detail_rapport_evaluation', '2026-01-01'),
            date_signature=requestBody.get('detail_date_signature', '2026-01-01'),
            date_livraison=requestBody.get('detail_date_livraison', '2026-01-01'),
            commentaire=requestBody.get('detail_remarque', 'Remarque par défaut')
        )
        
        biens_details_reel = BiensDetailsReel.objects.create(
            reel=requestBody.get('detail_reel', 'Réel'),
            biens=biens,
            listesetspecifications=requestBody.get('detail_listesetspecifications', '2026-01-01'),
            dossiers_appel=requestBody.get('detail_dossiers_appel', '2026-01-01'),
            date_lancement=requestBody.get('detail_date_lancement', '2026-01-01'),
            date_ouverture=requestBody.get('detail_date_ouverture', '2026-01-01'),
            rapport_evaluation=requestBody.get('detail_rapport_evaluation', '2026-01-01'),
            date_signature=requestBody.get('detail_date_signature', '2026-01-01'),
            date_livraison=requestBody.get('detail_date_livraison', '2026-01-01'),
            commentaire=requestBody.get('detail_remarque', 'Remarque par défaut')
        )

        return JsonResponse({'status': 'success', 'id': biens.id, 'detail_prevu_id': biens_details_prevu.id, 'detail_reel_id': biens_details_reel.id})
    return JsonResponse({'error': 'POST request required'}, status=400)


def lister_biens(request):
    biens_list = Biens.objects.all()
    data = []
    for biens in biens_list:
        detail_prevu = BiensDetailsPrevu.objects.filter(biens=biens).first()
        detail_reel = BiensDetailsReel.objects.filter(biens=biens).first()
        data.append({
            'id': biens.id,
            'code_suivi': biens.code_suivi,
            'intitule': biens.intitule,
            'montant_estimatif': str(biens.montant_estimatif),
            'agmo': biens.agmo,
            'methode_epm': biens.methode_epm,
            'approches': biens.approches,
            'revue': biens.revue,
            'prevu': str(detail_prevu.prevu) if detail_prevu else " ",
            'listesetspecifications_prevu': str(detail_prevu.listesetspecifications) if detail_prevu else " ",
            'dossiers_appel_prevu': str(detail_prevu.dossiers_appel) if detail_prevu else " ",
            'date_lancement_prevu': str(detail_prevu.date_lancement) if detail_prevu else " ",
            'date_ouverture_prevu': str(detail_prevu.date_ouverture) if detail_prevu else " ",
            'rapport_evaluation_prevu': str(detail_prevu.rapport_evaluation) if detail_prevu else " ",
            'date_signature_prevu': str(detail_prevu.date_signature) if detail_prevu else " ",
            'date_livraison_prevu': str(detail_prevu.date_livraison) if detail_prevu else " ",
            'commentaire_prevu': str(detail_prevu.commentaire) if detail_prevu else " ",
            'reel': str(detail_reel.reel) if detail_reel else " ",
            'listesetspecifications_reel': str(detail_reel.listesetspecifications) if detail_reel else " ",
            'dossiers_appel_reel': str(detail_reel.dossiers_appel) if detail_reel else " ",
            'date_lancement_reel': str(detail_reel.date_lancement) if detail_reel else " ",
            'date_ouverture_reel': str(detail_reel.date_ouverture) if detail_reel else " ",
            'rapport_evaluation_reel': str(detail_reel.rapport_evaluation) if detail_reel else " ",
            'date_signature_reel': str(detail_reel.date_signature) if detail_reel else " ",
            'date_livraison_reel': str(detail_reel.date_livraison) if detail_reel else " ",
            'commentaire_reel': str(detail_reel.commentaire) if detail_reel else " ",

        })
    return JsonResponse({'biens': data})

from datetime import datetime, timedelta
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculer_planning_biens(request):
    try:
        data = json.loads(request.body)
        
        # Récupération des données
        date_fin_str = data.get('date_fin')
        methode = data.get('methode', 'AOI').upper() # On force en majuscule pour éviter les erreurs
        duree = int(data.get('duree', 60))
        
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
            'date_livraison_prevu': date_fin.strftime('%Y-%m-%d')
        }
        
        return JsonResponse(dates)

    except ValueError:
        return JsonResponse({'error': 'Format de date invalide (attendu: YYYY-MM-DD)'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Erreur de calcul: {str(e)}"}, status=500)
