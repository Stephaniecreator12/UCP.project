from datetime import datetime
from django.contrib.auth import authenticate
from rest_framework.response import Response

def delete_service(request, model_class, id):
    password = request.data.get('password') if hasattr(request, "data") else None
    if not password:
        return Response({'error': 'Le mot de passe de confirmation est requis'}, status=400)
    user = authenticate(username=request.user.username, password=password)
    if user is None:
        return Response({'error': 'Mot de passe incorrect'}, status=403)
    try:
        item = model_class.objects.get(id=id)
    except model_class.DoesNotExist:
        return Response({'error': 'Élément non trouvé'}, status=404)
    item.delete()
    return Response({'message': 'Élément supprimé définitivement'}, status=200)

def arreter_service(request, model_class, id):
    try:
        item = model_class.objects.get(id=id)
    except model_class.DoesNotExist:
        return Response({"error": "Élément non trouvé"}, status=404)
    if getattr(item, 'statut', None) == "Terminé":
        return Response({"error": "Impossible d'arrêter : déjà terminé"}, status=409)
    if getattr(item, 'statut', None) == "Arrêté":
        return Response({"error": "Déjà arrêté"}, status=409)
    item.statut = "Arrêté"
    item.save()
    return Response({"ok": True, "id": item.id, "statut": item.statut, "message": "Arrêté avec succès"}, status=200)

def statut_service(dates_prevues: dict, dates_reelles: dict):
    aujourdhui = datetime.now().date()
    etapes_cles = list(dates_prevues.keys())
    total = len(etapes_cles)
    if total == 0:
        return "Données insuffisantes"

    def str_to_date(date_str):
        try:
            if isinstance(date_str, str):
                return datetime.strptime(date_str[:10], '%Y-%m-%d').date()
            return date_str
        except:
            return None

    index_dernier_rempli = -1
    for i, cle_prev in enumerate(etapes_cles):
        cle_reel = cle_prev.replace('_prevu', '_reel')
        if dates_reelles.get(cle_reel):
            index_dernier_rempli = i

    if index_dernier_rempli == -1:
        date_debut = str_to_date(dates_prevues[etapes_cles[0]])
        return "Non démarré (en retard)" if date_debut and date_debut < aujourdhui else "Non démarré (dans les temps)"
    if index_dernier_rempli == total - 1:
        return "Terminé"
    index_suivante = index_dernier_rempli + 1
    cle_suivante = etapes_cles[index_suivante]
    date_suivante = str_to_date(dates_prevues[cle_suivante])
    if date_suivante and date_suivante < aujourdhui:
        return "En cours (en retard)"
    return "En cours (dans les temps)"
