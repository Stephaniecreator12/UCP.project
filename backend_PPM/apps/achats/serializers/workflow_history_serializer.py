from rest_framework import serializers

from apps.achats.models.demande_achat import DemandeAchat
from apps.achats.models.Workflow_history import WorkflowHistory


class WorkflowHistorySerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_nom = serializers.SerializerMethodField()
    action_display = serializers.CharField(source="get_action_display", read_only=True)
    old_status_display = serializers.SerializerMethodField()
    new_status_display = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowHistory
        fields = [
            "id",
            "action",
            "action_display",
            "old_status",
            "old_status_display",
            "new_status",
            "new_status_display",
            "commentaire",
            "user",
            "user_username",
            "user_nom",
            "created_at",
        ]

    def get_user_nom(self, obj):
        if not obj.user:
            return ""
        return obj.user.get_full_name() or obj.user.username

    def _status_label(self, value):
        if not value:
            return ""
        return dict(DemandeAchat.STATUT_CHOICES).get(value, value)

    def get_old_status_display(self, obj):
        return self._status_label(obj.old_status)

    def get_new_status_display(self, obj):
        return self._status_label(obj.new_status)
