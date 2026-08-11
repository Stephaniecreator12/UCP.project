from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.common.models import ChoiceGroup, ReferenceChoice


@api_view(["GET"])
@permission_classes([AllowAny])
def reference_choices_view(request):
    """Liste des choix centralisés (groupes d'options) pour l'alimenter l'interface.

    Réponse : {"PROCEDURE_TYPE": [{"code": "DC", "label": "DC"}, ...], ...}
    Le filtre `?group=PROCEDURE_TYPE` ne renvoie que ce groupe.
    """
    group = (request.query_params.get("group") or "").strip().upper()
    queryset = ReferenceChoice.objects.filter(is_active=True).order_by("group", "sort_order", "code")
    if group:
        if group not in ChoiceGroup.values:
            return Response({"detail": f"Groupe inconnu: {group}"}, status=400)
        queryset = queryset.filter(group=group)

    data = {}
    for choice in queryset:
        data.setdefault(choice.group, []).append({"code": choice.code, "label": choice.label})
    return Response(data)
