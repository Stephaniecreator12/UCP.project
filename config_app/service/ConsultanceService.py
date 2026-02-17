import json
from django.http import JsonResponse
from ..entity.Consultance import Consultance
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

# INSERER DONNEES
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
                'commentaire': 'Remarque par défaut',
                'statut': 'En cours'
            }
            
            data.update(request_data)
            consultance = Consultance.objects.create(**data)
            
            return JsonResponse({'status': 'success', 'id': consultance.id}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

# LISTER LES CONSULTANCES
def lister_consultance(request):
    # Récupère tout d'un coup sous forme de dictionnaire
    data = list(Consultance.objects.values())
    return JsonResponse({'consultance': data})

# CALCULER LE PLANNING DES CONSULTANCES
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

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def statut_consultance(request):
    # Récupération des données depuis le corps de la requête (POST)
    dates_prevues = request.data.get('dates_prevues', {})
    dates_reelles = request.data.get('dates_reels', {})
    
    aujourdhui = timezone.now().date()
    etapes_prevues = list(dates_prevues.keys())
    total = len(etapes_prevues)

    if total == 0:
        return Response({"statut": "Données insuffisantes"}, status=400)

    # 1. Trouver l'index de la dernière étape réalisée
    index_dernier_rempli = -1
    for i, cle_prev in enumerate(etapes_prevues):
        # On suppose que la clé réelle correspond à la clé prévue (ex: 'ami_prevu' -> 'ami_reel')
        cle_reel = cle_prev.replace('_prevu', '_reel')
        if dates_reelles.get(cle_reel): # Correction : utilisait 'donnees_reelles' au lieu de 'dates_reelles'
            index_dernier_rempli = i

    # --- LOGIQUE DU STATUT ---

    # CAS A : Rien n'a commencé
    if index_dernier_rempli == -1:
        # On vérifie la date de la toute première étape attendue
        date_premiere_etape = dates_prevues[etapes_prevues[0]]
        # Conversion si c'est une string, sinon comparaison directe
        if date_premiere_etape < aujourdhui:
            res = "Non démarré (en retard)"
        else:
            res = "Non démarré (dans les temps)"

    # CAS B : La toute dernière étape est remplie
    elif index_dernier_rempli == total - 1:
        res = "Terminé"

    # CAS C : En cours de route
    else:
        index_etape_suivante = index_dernier_rempli + 1
        cle_suivante = etapes_prevues[index_etape_suivante]
        date_prevue_suivante = dates_prevues[cle_suivante]

        if date_prevue_suivante < aujourdhui:
            nom_etape = cle_suivante.replace('_prevu', '')
            res = f"En cours (en retard) - Prochaine étape: {nom_etape}"
        else:
            res = "En cours (dans les temps)"

    return Response({"statut": res})