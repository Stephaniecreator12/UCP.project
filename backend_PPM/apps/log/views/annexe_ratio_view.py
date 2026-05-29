from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.log.models.download import LogDownload
from apps.log.models.consultation import LogConsultation

class AnnexeDownloadRatioAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            vues_par_dossier = {
                item['dossier_id']: item['total_views']
                for item in LogConsultation.objects.values('dossier_id').annotate(total_views=Count('id'))
            }

            annexes_stats = (
                LogDownload.objects.filter(doc_type='ANNEXE')
                .values('dossier_id', 'dossier__title', 'annexe_name')
                .annotate(total_downloads=Count('id'))
            )

            result_data = []
            for item in annexes_stats:
                dossier_id = item['dossier_id']
                download_count = item['total_downloads']
                
                view_count = vues_par_dossier.get(dossier_id, 0)

                if view_count > 0:
                    percentage = (download_count / view_count) * 100
                    percentage = round(percentage, 2) 
                else:
                    percentage = 0.0

                result_data.append({
                    "dossier_id": dossier_id,
                    "dossier_title": item['dossier__title'],
                    "annexe_name": item['annexe_name'],
                    "total_downloads": download_count,
                    "total_market_views": view_count,
                    "download_rate_percentage": percentage
                })

            result_data = sorted(result_data, key=lambda x: x['download_rate_percentage'], reverse=True)

            return Response({"error": False, "data": result_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": True, "message": f"Erreur lors du calcul des ratios : {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )