import json
from django.http import JsonResponse
from ..entity.Biens import Biens
from datetime import datetime, timedelta
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .ProcurementService import delete_service, arreter_service

# INSERER DONNEES
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
                'statut': 'En cours',
                'listesetspecifications_prevu': '2026-01-01',
                'dossiers_appel_prevu': '2026-01-01',
                'date_lancement_prevu': '2026-01-01',
                'date_ouverture_prevu': '2026-01-01',
                'rapport_evaluation_prevu': '2026-01-01',
                'date_signature_prevu': '2026-01-01',
                'date_livraison_prevu': '2026-01-01',
                'listesetspecifications_reel': '2026-01-01',
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

# UPDATE BIENS
@csrf_exempt
def update_biens(request, id):
    if request.method not in ['PUT', 'PATCH', 'POST']:
        return JsonResponse({'error': 'PUT/PATCH/POST request required'}, status=405)
    try:
        request_data = json.loads(request.body)
        biens = Biens.objects.get(id=id)
        for key, value in request_data.items():
            if hasattr(biens, key):
                setattr(biens, key, value)
        biens.save()
        return JsonResponse({'status': 'success', 'id': biens.id}, status=200)
    except Biens.DoesNotExist:
        return JsonResponse({'error': 'Biens non trouve'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# LISTER LES BIENS
def lister_biens(request):
    # .values() récupère automatiquement tous les champs de la table
    # et les transforme en dictionnaire (id, intitule, date_lancement_prevu, etc.)
    biens_data = list(Biens.objects.values())
    
    return JsonResponse({'biens': biens_data})

# CALCULER LE PLANNING DES BIENS
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

# STATUT BIENS
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def statut_biens(request):
    # Récupération sécurisée des dictionnaires
    dates_prevues = request.data.get('dates_prevues', {})
    dates_reelles = request.data.get('dates_reels', {})
    
    aujourdhui = timezone.now().date()
    etapes_cles = list(dates_prevues.keys())
    total = len(etapes_cles)

    if total == 0:
        return Response({"statut": "Données insuffisantes"}, status=400)

    # Helper pour convertir le texte reçu en date réelle pour la comparaison
    def str_to_date(date_str):
        try:
            if isinstance(date_str, str):
                return datetime.strptime(date_str, '%Y-%m-%d').date()
            return date_str
        except:
            return None

    # 1. Identifier la progression (Boucle FOR)
    index_dernier_rempli = -1
    for i, cle_prev in enumerate(etapes_cles):
        cle_reel = cle_prev.replace('_prevu', '_reel')
        if dates_reelles.get(cle_reel):
            index_dernier_rempli = i

    # 2. Détermination du statut textuel unique
    res = ""
    
    # CAS A : Rien n'a commencé
    if index_dernier_rempli == -1:
        date_debut = str_to_date(dates_prevues[etapes_cles[0]])
        if date_debut and date_debut < aujourdhui:
            res = "Non démarré (en retard)"
        else:
            res = "Non démarré (dans les temps)"

    # CAS B : La toute dernière étape est remplie
    elif index_dernier_rempli == total - 1:
        res = "Terminé"

    # CAS C : En cours de route (on regarde l'étape suivante)
    else:
        index_suivante = index_dernier_rempli + 1
        cle_suivante = etapes_cles[index_suivante]
        date_suivante = str_to_date(dates_prevues[cle_suivante])

        if date_suivante and date_suivante < aujourdhui:
            res = "En cours (en retard)"
        else:
            res = "En cours (dans les temps)"

    return Response({"statut": res}) 

# SUPPRIMER BIENS
@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def supprimer_biens(request, id):
    return delete_service(request, Biens, id) 

# ARRETER BIENS
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def arreter_biens(request, id):
    return arreter_service(request, Biens, id)   
