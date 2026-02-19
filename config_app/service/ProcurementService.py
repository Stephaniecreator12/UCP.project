from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response # IMPORTANT : pas JsonResponse ici
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['POST']) # On force le POST
@permission_classes([IsAuthenticated])
def soft_delete_service(request, model_class, id):
    try:
        # Suppression réelle en base (hard delete)
        item = model_class.objects.get(id=id)
        item.delete()
        return Response({'status': 'success'}, status=200)
    except model_class.DoesNotExist:
        return Response({'error': 'Élément non trouvé'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
