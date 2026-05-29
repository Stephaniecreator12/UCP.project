from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.log.models.consultation import LogConsultation
class ProcurementViewCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            stats = (
                LogConsultation.objects.values('dossier_id')
                .annotate(total_views=Count('id'))
                .order_by('-total_views')
            )
            data = list(stats)

            return Response(
                {
                    "error": False,
                    "data": data
                }, 
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {
                    "error": True,
                    "message": f"Erreur lors de la récupération des statistiques : {str(e)}"
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )