from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.procurement.models.procurement_market import ProcurementMarket
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
class OperationalMonitoringAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:

            result = []
            published = ProcurementMarket.objects.filter(
                status='PUBLISHED'
            ).count()

            closed = ProcurementMarket.objects.filter(
                status='CLOSED'
            ).count()

            closure_rate = (
                closed / published * 100
            ) if published else 0

            seven_days_ago = timezone.now() - timedelta(days=7)

            invisible_folders = (
                ProcurementMarket.objects
                .annotate(
                    recent_views=Count(
                        'logs_vues',
                        filter=Q(
                            logs_vues__timestamp__gte=seven_days_ago
                        )
                    )
                )
                .filter(recent_views=0)
            )
            
            alerts = ProcurementMarket.objects.filter(
                deadline__gte=timezone.now(),
                deadline__lte=timezone.now() + timedelta(hours=48)
            )
            result.append({
                "closure_rate": round(closure_rate, 2),
                "invisible_folders": list(invisible_folders.values('id', 'title')),
                "alerts": list(alerts.values('id', 'title', 'deadline'))  
            })
            

            return Response({"error": False, "data": list(result)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": True, "message": f"Erreur backend : {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )