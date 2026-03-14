from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response 
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from datetime import datetime
from django.utils import timezone

# SUPPRIMER 
@csrf_exempt
def delete_service(request, model_class, id):
    try:
        # 1. Récupérer le mot de passe (dans une requête DELETE, les données sont dans request.data)
        password = request.data.get('password')
        
        if not password:
            return Response({'error': 'Le mot de passe de confirmation est requis'}, status=400)

        # 2. Vérifier l'utilisateur
        user = authenticate(username=request.user.username, password=password)
        
        if user is None:
            return Response({'error': 'Mot de passe incorrect'}, status=403)

        # 3. Récupération de l'objet
        item = model_class.objects.get(id=id)
        
        # 4. HARD DELETE (Suppression définitive de la base de données)
        item.delete()
        
        return Response({'message': 'Élément supprimé définitivement'}, status=200)

    except model_class.DoesNotExist:
        return Response({'error': 'Élément non trouvé'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# ARRETER
def arreter_service(request, model_class, id):
    try:
        item = model_class.objects.get(id=id)

        # Vérification des statuts
        if getattr(item, 'statut', None) == "Terminé":
            return Response({"error": "Impossible d'arrêter : le marché est déjà terminé"}, status=409)
        
        if getattr(item, 'statut', None) == "Arrêté":
            return Response({"error": "Ce marché est déjà arrêté"}, status=409)

        # Mise à jour du statut
        item.statut = "Arrêté"
        item.save()
        
        return Response({
            "ok": True, 
            "id": item.id, 
            "statut": item.statut,
            "message": "Le marché a été arrêté avec succès"
        }, status=200)

    except model_class.DoesNotExist:
        return Response({"error": "Élément non trouvé"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# STATUT
@csrf_exempt 
def statut_service(request):
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
