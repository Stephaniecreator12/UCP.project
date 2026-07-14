from django.contrib.auth.models import Group
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.users.serializers.groups_serializer import GroupDetailSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_groups(request):
    groups = Group.objects.all().order_by('name')
    serializer = GroupDetailSerializer(groups, many=True)
    return Response(serializer.data)