from rest_framework import serializers

from apps.achats.models import DemandeAchat, ValidationDemande

ALLOWED_DECISIONS_BY_STEP = {
    DemandeAchat.ETAPE_HIERARCHIQUE: {
        ValidationDemande.DECISION_FAVORABLE,
        ValidationDemande.DECISION_DEFAVORABLE,
        ValidationDemande.DECISION_A_COMPLETER,
    },
    DemandeAchat.ETAPE_TECHNIQUE: {
        ValidationDemande.DECISION_FAVORABLE,
        ValidationDemande.DECISION_DEFAVORABLE,
        ValidationDemande.DECISION_A_COMPLETER,
    },
    DemandeAchat.ETAPE_PROGRAMMATIQUE: {
        ValidationDemande.DECISION_APPROUVEE,
        ValidationDemande.DECISION_REJETEE,
        ValidationDemande.DECISION_A_REVOIR,
    },
    DemandeAchat.ETAPE_APPROBATION_FINALE: {
        ValidationDemande.DECISION_APPROUVEE,
        ValidationDemande.DECISION_REJETEE,
        ValidationDemande.DECISION_A_REVOIR,
    },
}

REQUIRED_FIELDS_BY_STEP = {
    DemandeAchat.ETAPE_TECHNIQUE: [
        "conformite_technique",
        "verification_stock",
    ],
}


class ValidationDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=ValidationDemande.DECISION_CHOICES)
    commentaire = serializers.CharField(required=False, allow_blank=True)
    donnees_etape = serializers.JSONField(required=False)

    def validate(self, attrs):
        demande = self.context.get("demande")
        if not demande:
            return attrs

        decision = attrs["decision"]
        commentaire = attrs.get("commentaire", "").strip()
        donnees_etape = attrs.get("donnees_etape") or {}

        if not isinstance(donnees_etape, dict):
            raise serializers.ValidationError(
                {"donnees_etape": "Les données de l'étape doivent être un objet JSON."}
            )

        current_step = demande.etape_validation_actuelle
        allowed_decisions = ALLOWED_DECISIONS_BY_STEP.get(current_step, set())
        if allowed_decisions and decision not in allowed_decisions:
            raise serializers.ValidationError(
                {
                    "decision": "Cette décision n'est pas autorisée pour l'étape actuelle."
                }
            )

        required_fields = REQUIRED_FIELDS_BY_STEP.get(current_step, [])
        missing_fields = [field for field in required_fields if not donnees_etape.get(field)]
        if missing_fields:
            raise serializers.ValidationError(
                {
                    "donnees_etape": "Renseigne tous les champs obligatoires de cette étape.",
                    "missing_fields": missing_fields,
                }
            )

        if decision in {
            ValidationDemande.DECISION_DEFAVORABLE,
            ValidationDemande.DECISION_REJETEE,
            ValidationDemande.DECISION_A_COMPLETER,
            ValidationDemande.DECISION_A_REVOIR,
        } and not commentaire:
            raise serializers.ValidationError(
                {"commentaire": "Ajoute une observation pour cette décision."}
            )

        attrs["commentaire"] = commentaire
        attrs["donnees_etape"] = donnees_etape
        return attrs
