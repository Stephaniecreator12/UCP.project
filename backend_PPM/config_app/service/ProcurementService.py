from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response 
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate

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