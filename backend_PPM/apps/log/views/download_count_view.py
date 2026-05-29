from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.log.models.download import LogDownload

class DAODownloadCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            stats = (
                LogDownload.objects.filter(doc_type='DAO')
                .values('dossier_id', 'dossier__title')
                .annotate(total_dao_downloads=Count('id'))
                .order_by('-total_dao_downloads')
            )

            return Response({"error": False, "data": list(stats)}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": True, "message": f"Erreur backend : {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )