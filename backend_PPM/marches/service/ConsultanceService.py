import json
from django.http import JsonResponse
from ..entity.Consultance import Consultance
from ..entity.ConsultanceDetailsPrevu import ConsultanceDetailsPrevu
from ..entity.ConsultanceDetailsReel import ConsultanceDetailsReel
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta

@csrf_exempt
def insert_mock_consultance(request):
    if request.method == 'POST':
        requestBody = json.loads(request.body)

        # mampiditra anle consultance any anaty base de données
        consultance = Consultance.objects.create(
            ref_code_suivi=requestBody.get('code_suivi', 'Code Suivi par défaut'),
            intitule=requestBody.get('intitule'),
            agmoxdirection=requestBody.get('agmoxdirection', 'Direction Générale'),
            montant_estimatif=requestBody.get('montant_estimatif', 1000000.00),
            methode=requestBody.get('methode', 'Appel d\'offres'),
            approche=requestBody.get('approche', 'Approche 1'),
            revue=requestBody.get('revue', 'Revue préalable'),
            forfaitxtemps=requestBody.get('forfaitxtemps', 'Forfait')
        )

        ConsultanceDetailsPrevu = ConsultanceDetailsPrevu.objects.create(
            TdR=requestBody.get('detail_TdR', '2026-01-01'),
            consultance=consultance,
            ami=requestBody.get('detail_ami', '2026-01-01'),
            liste_restreinte=requestBody.get('detail_liste_restreinte', '2026-01-01'),
            demande_proposition=requestBody.get('detail_demande_proposition', '2026-01-01'),
            date_invitation=requestBody.get('detail_date_invitation', '2026-01-01'),
            date_ouverture=requestBody.get('detail_date_ouverture', '2026-01-01'),
            rapport_evaluation=requestBody.get('detail_rapport_evaluation', '2026-01-01'),
            ouverture_plis=requestBody.get('detail_ouverture_plis', '2026-01-01'),
            projet_contrat=requestBody.get('detail_projet_contrat', '2026-01-01'),
            date_signature=requestBody.get('detail_date_signature', '2026-01-01'),
            date_fin=requestBody.get('detail_date_fin', '2026-01-01'),
            commentaire=requestBody.get('detail_remarque', 'Remarque par défaut')
        )
        
        ConsultanceDetailsReel = ConsultanceDetailsReel.objects.create(
            TdR=requestBody.get('detail_TdR', '2026-01-01'),
            consultance=consultance,
            ami=requestBody.get('detail_ami', '2026-01-01'),
            liste_restreinte=requestBody.get('detail_liste_restreinte', '2026-01-01'),
            demande_proposition=requestBody.get('detail_demande_proposition', '2026-01-01'),
            date_invitation=requestBody.get('detail_date_invitation', '2026-01-01'),
            date_ouverture=requestBody.get('detail_date_ouverture', '2026-01-01'),
            rapport_evaluation=requestBody.get('detail_rapport_evaluation', '2026-01-01'),
            ouverture_plis=requestBody.get('detail_ouverture_plis', '2026-01-01'),
            projet_contrat=requestBody.get('detail_projet_contrat', '2026-01-01'),
            date_signature=requestBody.get('detail_date_signature', '2026-01-01'),
            date_fin=requestBody.get('detail_date_fin', '2026-01-01'),
            commentaire=requestBody.get('detail_remarque', 'Remarque par défaut')
        )

        return JsonResponse({'status': 'success', 'id': consultance.id, 'detailprevu_id': ConsultanceDetailsPrevu.id, 'detailreel_id': ConsultanceDetailsReel.id})
    return JsonResponse({'error': 'POST request required'}, status=400)


def lister_consultance(request):
    consultance_list = Consultance.objects.all()
    data = []
    for consultance in consultance_list:
        detailprevu = ConsultanceDetailsPrevu.objects.filter(consultance=consultance).first()
        detailreel = ConsultanceDetailsReel.objects.filter(consultance=consultance).first()
        data.append({
            'id': consultance.id,
            'ref_code_suivi': consultance.ref_code_suivi,
            'intitule': consultance.intitule,
            'montant_estimatif': str(consultance.montant_estimatif),
            'agmoxdirection': consultance.agmoxdirection,
            'methode': consultance.methode,
            'approche': consultance.approche,
            'revue': consultance.revue,
            'forfaitxtemps': consultance.forfaitxtemps,
            'TdR_prevu': str(detailprevu.TdR) if detailprevu else " ",
            'ami_prevu': str(detailprevu.ami) if detailprevu else " ",
            'liste_restreinte_prevu': str(detailprevu.liste_restreinte) if detailprevu else " ",
            'demande_proposition_prevu': str(detailprevu.demande_proposition) if detailprevu else " ",
            'date_invitation_prevu': str(detailprevu.date_invitation) if detailprevu else " ",
            'date_ouverture_prevu': str(detailprevu.date_ouverture) if detailprevu else " ",
            'rapport_evaluation_prevu': str(detailprevu.rapport_evaluation) if detailprevu else " ",
            'ouverture_plis_prevu': str(detailprevu.ouverture_plis) if detailprevu else " ",
            'projet_contrat_prevu': str(detailprevu.projet_contrat) if detailprevu else " ",
            'date_signature_prevu': str(detailprevu.date_signature) if detailprevu else " ",
            'date_fin_prevu': str(detailprevu.date_fin) if detailprevu else " ",
            'commentaire_prevu': str(detailprevu.commentaire) if detailprevu else " ",
            'TdR_reel': str(detailreel.TdR) if detailreel else " ",
            'ami_reel': str(detailreel.ami) if detailreel else " ",
            'liste_restreinte_reel': str(detailreel.liste_restreinte) if detailreel else " ",
            'demande_proposition_reel': str(detailreel.demande_proposition) if detailreel else " ",
            'date_invitation_reel': str(detailreel.date_invitation) if detailreel else " ",
            'date_ouverture_reel': str(detailreel.date_ouverture) if detailreel else " ",
            'rapport_evaluation_reel': str(detailreel.rapport_evaluation) if detailreel else " ",
            'ouverture_plis_reel': str(detailreel.ouverture_plis) if detailreel else " ",
            'projet_contrat_reel': str(detailreel.projet_contrat) if detailreel else " ",
            'date_signature_reel': str(detailreel.date_signature) if detailreel else " ",
            'date_fin_reel': str(detailreel.date_fin) if detailreel else " ",
            'commentaire_reel': str(detailreel.commentaire) if detailreel else " "
        })
    return JsonResponse({'consultance': data})

from datetime import datetime, timedelta
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

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
            'SQC':  (70, 7, 20, 30, 35, 49)
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
