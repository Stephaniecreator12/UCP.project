# contracts/serializers/audit.py

from rest_framework import serializers

from apps.contrats.models.audit_log import ContratAuditLog


class ContratAuditSerializer(serializers.ModelSerializer):

    utilisateur = serializers.StringRelatedField()

    class Meta:
        model = ContratAuditLog

        fields = (
            "id",
            "utilisateur",
            "action",
            "details",
            "date_action",
        )