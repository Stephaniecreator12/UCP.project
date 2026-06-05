from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.log.models.download import LogDownload
from apps.log.models.consultation import LogConsultation
class IndividualTraceabilityAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            User = get_user_model()

            users = User.objects.all()

            result = []

            for user in users:

                consultations = (
                    LogConsultation.objects
                    .filter(user_id=user.id)
                    .values_list(
                        'dossier__title',
                        flat=True
                    )
                    .distinct()
                )
                downloads = (
                    LogDownload.objects
                    .filter(
                        user_id=user.id,
                        doc_type='DAO'
                    )
                    .values_list(
                        'dossier__title',
                        flat=True
                    )
                    .distinct()
                )
                result.append({
                    "user": user.full_name,
                    "creation_date": user.created_at,
                    "lastLogin": user.last_login,
                    "consultations": list(consultations),
                    "download": list(downloads)
                })
            

            return Response({"error": False, "data": list(result)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": True, "message": f"Erreur backend : {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )