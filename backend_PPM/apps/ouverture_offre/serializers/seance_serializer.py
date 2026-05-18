from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.ouverture_offre.models import MembreSeance, SeanceOuverture, OffreOuverture
from .user_serializer import SimpleUserSerializer

User = get_user_model()


class MembreSeanceSerializer(serializers.ModelSerializer):
    utilisateur_detail = SimpleUserSerializer(source="utilisateur", read_only=True)

    class Meta:
        model = MembreSeance
        fields = [
            "id",
            "utilisateur",
            "utilisateur_detail",
            "est_present",
            "a_valide",
            "commentaire",
            "date_validation",
        ]
        read_only_fields = ["a_valide", "date_validation"]

class OffreOuvertureSerializer(serializers.ModelSerializer):
    class Meta:
        model = OffreOuverture
        fields = [
            "id",
            "ordre_passage",
            "nom_soumissionnaire",
            "pli_existe",
            "motif_absence_pli",
            "date_reception_pli",
            "heure_reception_pli",
            "enveloppe_administrative",
            "enveloppe_technique",
            "enveloppe_financiere",
            "montant_global",
            "observations",
        ]

class SeanceOuvertureSerializer(serializers.ModelSerializer):
    secretaire_detail = SimpleUserSerializer(source="secretaire", read_only=True)
    president_detail = SimpleUserSerializer(source="president", read_only=True)
    membres = MembreSeanceSerializer(many=True, read_only=True)
    membre_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    offres = OffreOuvertureSerializer(many=True, required=False)
    class Meta:
        model = SeanceOuverture
        fields = [
            "id",
            "reference_dossier",
            "objet_dossier",
            "date_seance",
            "heure_seance",
            "lieu",
            "observations",
            "statut",
            "secretaire",
            "secretaire_detail",
            "president",
            "president_detail",
            "membres",
            "membre_ids",
            "created_at",
            "updated_at",
            "president_a_valide",
            "president_commentaire",
            "date_validation_president",
            "etape_ouverture",
            "etat_scelle",
            "presence_rature",
            "description_rature",
            "document_substitution_present",
            "offres",

        ]
        read_only_fields = [
            "secretaire",
            "created_at",
            "updated_at",
            "president_a_valide",
            "president_commentaire",
            "date_validation_president",
        ]

    def validate_membre_ids(self, value):
        unique_ids = list(dict.fromkeys(value))
        if len(unique_ids) != len(value):
            raise serializers.ValidationError("Un meme membre ne doit pas apparaitre deux fois.")
        users_count = User.objects.filter(id__in=unique_ids, is_active=True).count()
        if users_count != len(unique_ids):
            raise serializers.ValidationError("Un ou plusieurs membres sont introuvables.")
        return unique_ids

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        statut = attrs.get("statut", getattr(instance, "statut", SeanceOuverture.Statut.BROUILLON))
        president = attrs.get("president", getattr(instance, "president", None))
        date_seance = attrs.get("date_seance", getattr(instance, "date_seance", None))
        heure_seance = attrs.get("heure_seance", getattr(instance, "heure_seance", None))
        lieu = attrs.get("lieu", getattr(instance, "lieu", ""))
        membre_ids = attrs.get("membre_ids", None)
        existing_member_count = instance.membres.count() if instance else 0
        member_count = len(membre_ids) if membre_ids is not None else existing_member_count

        if membre_ids and president and president.id in membre_ids:
            raise serializers.ValidationError({
                "membre_ids": "Le president ne doit pas etre dans la liste des membres."
            })

        if statut != SeanceOuverture.Statut.BROUILLON:
            errors = {}
            if not president:
                errors["president"] = "Choisis un president."
            if not date_seance:
                errors["date_seance"] = "Renseigne la date de seance."
            if not heure_seance:
                errors["heure_seance"] = "Renseigne l heure de seance."
            if not lieu:
                errors["lieu"] = "Renseigne le lieu."
            if member_count < 3:
                errors["membre_ids"] = "Selectionne au moins 3 membres."
            if errors:
                raise serializers.ValidationError(errors)

        offres = attrs.get("offres", None)

        if offres:
            for index, offre in enumerate(offres, start=1):
                if not offre.get("nom_soumissionnaire"):
                    raise serializers.ValidationError({
                        "offres": f"La ligne {index} doit avoir un nom de soumissionnaire."
                    })

                if not offre.get("pli_existe") and not offre.get("motif_absence_pli"):
                    raise serializers.ValidationError({
                        "offres": f"La ligne {index} doit renseigner le motif d'absence du pli."
                    })
                    
        return attrs

class ValidationMembreSerializer(serializers.Serializer):
    commentaire = serializers.CharField(required=False, allow_blank=True)

class ValidationPresidentSerializer(serializers.Serializer):
    commentaire = serializers.CharField(required=False, allow_blank=True)
