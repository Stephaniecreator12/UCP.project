from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated  
from apps.log.serializers.track_action_serializer import TrackActionSerializer

class TrackActionView(APIView):
    permission_classes = [IsAuthenticated] 

    def post(self, request):
        serializer = TrackActionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "message": "Log enregistré"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

