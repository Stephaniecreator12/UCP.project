from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.log.services.operational_monitoring_service import (
    get_operational_monitoring_data
)


class OperationalMonitoringAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            data = get_operational_monitoring_data()

            return Response(
                {"error": False, "data": data},
                status=200
            )

        except Exception as e:
            return Response(
                {"error": True, "message": str(e)},
                status=500
            )