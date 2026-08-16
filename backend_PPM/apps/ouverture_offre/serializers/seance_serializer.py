from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.ouverture_offre.models import (
    MembreSeance,
    SeanceOuverture,
    OffreOuverture,
    PVDocument,
    ValidationCompositionMembre,
)
from .user_serializer import SimpleUserSerializer

User = get_user_model()

COMMON_EMAIL_DOMAIN_FIXES = {
    "gail.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gmial.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gnail.com": "gmail.com",
    "gmail.con": "gmail.com",
    "yaho.com": "yahoo.com",
    "yahoo.con": "yahoo.com",
    "hotmai.com": "hotmail.com",
    "hotmial.com": "hotmail.com",
    "hotmail.con": "hotmail.com",
    "outlok.com": "outlook.com",
    "outllook.com": "outlook.com",
    "outlook.con": "outlook.com",
    "icloud.con": "icloud.com",
}

COMMON_COM_TLD_TYPOS = (".con", ".cim", ".cpm", ".copm", ".comm")


def get_email_typo_suggestion(email):
    value = (email or "").strip()
    if value.count("@") != 1:
        return ""

    local_part, domain = value.rsplit("@", 1)
    normalized_domain = domain.lower()
    suggested_domain = COMMON_EMAIL_DOMAIN_FIXES.get(normalized_domain)

    if not suggested_domain:
        for typo in COMMON_COM_TLD_TYPOS:
            if normalized_domain.endswith(typo):
                suggested_domain = f"{domain[:-len(typo)]}.com"
                break

    if not suggested_domain or suggested_domain.lower() == normalized_domain:
        return ""

    return f"{local_part}@{suggested_domain}"


def validate_email_typo(email):
    suggestion = get_email_typo_suggestion(email)
    if suggestion:
        raise serializers.ValidationError(
            "Adresse e-mail probablement mal saisie : "
            f"{email}. Voulez-vous dire {suggestion} ? "
            "Les domaines autres que Gmail restent acceptes."
        )
    return email


class PVDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PVDocument
        fields = [
            "id",
            "fichier",
            "version",
            "hash_document",
            "created_at",
        ]


class ValidationCompositionMembreSerializer(serializers.ModelSerializer):
    validateur_detail = SimpleUserSerializer(source="validateur", read_only=True)
    role_code = serializers.SerializerMethodField()

    class Meta:
        model = ValidationCompositionMembre
        fields = [
            "id",
            "role",
            "role_code",
            "validateur",
            "validateur_detail",
            "decision",
            "commentaire",
            "date_validation",
            "notification_sent_at",
        ]
        read_only_fields = fields

    def get_role_code(self, obj):
        # map RPM -> rp, GP -> gp, CN -> cn
        if not obj or not getattr(obj, "role", None):
            return None
        role = obj.role
        if role == "RPM":
            return "rp"
        return role.lower()


class MembreSeanceSerializer(serializers.ModelSerializer):
    utilisateur_detail = SimpleUserSerializer(source="utilisateur", read_only=True)

    class Meta:
        model = MembreSeance
        fields = [
            "id",
            "utilisateur",
            "utilisateur_detail",
            "nom_prenom",
            "numero_carte",
            "intitule",
            "poste",
            "est_present",
            "a_valide",
            "decision",
            "commentaire",
            "date_validation",
            "ip_adresse",
            "navigateur",
        ]
        read_only_fields = [
            "nom_prenom",
            "numero_carte",
            "intitule",
            "poste",
            "a_valide",
            "decision",
            "date_validation",
            "ip_adresse",
            "navigateur",
        ]

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
            "etat_scelle",
            "presence_rature",
            "description_rature",
            "document_substitution_present",
            "montant_global",
            "observations",
        ]


class CommissionMemberInputSerializer(serializers.Serializer):
    nomPrenom = serializers.CharField()
    email = serializers.EmailField()
    cin = serializers.RegexField(
        regex=r"^\d{12}$",
        error_messages={"invalid": "Le CIN doit contenir exactement 12 chiffres."},
    )
    poste = serializers.CharField()
    entite = serializers.CharField()

    def validate_email(self, value):
        return validate_email_typo(value)


class SeanceOuvertureSerializer(serializers.ModelSerializer):
    secretaire_detail = SimpleUserSerializer(source="secretaire", read_only=True)
    president_detail = SimpleUserSerializer(source="president", read_only=True)
    membres = MembreSeanceSerializer(many=True, read_only=True)
    validations_composition = ValidationCompositionMembreSerializer(
        many=True,
        read_only=True,
    )
    membre_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    offres = OffreOuvertureSerializer(many=True, required=False)
    commission_members = CommissionMemberInputSerializer(
        many=True,
        write_only=True,
        required=False,
    )
    pv_document = PVDocumentSerializer(read_only=True)
    composition_validation_statut = serializers.SerializerMethodField()
    composition_validation_role_courant = serializers.SerializerMethodField()
    composition_validation_est_urgent = serializers.SerializerMethodField()

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
            "membres_verrouilles",
            "date_soumission_membres",
            "secretaire",
            "secretaire_detail",
            "president",
            "president_detail",
            "membres",
            "validations_composition",
            "membre_ids",
            "commission_members",
            "created_at",
            "updated_at",
            "composition_validation_statut",
            "composition_validation_role_courant",
            "composition_validation_est_urgent",
            "president_a_valide",
            "president_decision",
            "president_commentaire",
            "date_validation_president",
            "president_ip_adresse",
            "president_navigateur",
            "etape_ouverture",
            "etat_scelle",
            "presence_rature",
            "description_rature",
            "document_substitution_present",
            "offres",
            "pv_document",
        ]
        read_only_fields = [
            "secretaire",
            "created_at",
            "updated_at",
            "president_a_valide",
            "president_decision",
            "president_commentaire",
            "date_validation_president",
            "president_ip_adresse",
            "president_navigateur",
            "pv_document",
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
        etat_scelle = attrs.get("etat_scelle", getattr(instance, "etat_scelle", ""))
        presence_rature = attrs.get("presence_rature", getattr(instance, "presence_rature", False))
        description_rature = attrs.get(
            "description_rature",
            getattr(instance, "description_rature", ""),
        )
        membre_ids_provided = "membre_ids" in attrs
        commission_members_provided = "commission_members" in attrs
        membre_ids = attrs.get("membre_ids", None) or []
        commission_members = attrs.get("commission_members", None) or []

        if commission_members_provided:
            total_membres = len(commission_members)
            member_error_field = "commission_members"
        elif membre_ids_provided:
            total_membres = len(membre_ids)
            member_error_field = "membre_ids"
        elif instance:
            total_membres = instance.membres.filter(est_present=True).count()
            member_error_field = "commission_members"
        else:
            total_membres = 0
            member_error_field = "commission_members"

        if total_membres < 3:
            manquants = 3 - total_membres
            raise serializers.ValidationError({
                member_error_field: (
                    f"Il manque {manquants} membre(s) à la commission "
                    f"({total_membres}/3 requis)."
                )
            })

        if commission_members:
            emails = [m["email"].strip().lower() for m in commission_members]
            if len(set(emails)) != len(emails):
                raise serializers.ValidationError({
                    "commission_members": "Un même email ne doit pas apparaître deux fois."
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

    def get_composition_validation_statut(self, obj):
        from apps.ouverture_offre.services.composition_validation_service import (
            get_composition_dashboard_statut,
        )

        return get_composition_dashboard_statut(obj)

    def get_composition_validation_role_courant(self, obj):
        from apps.ouverture_offre.services.composition_validation_service import (
            get_active_composition_role,
        )

        role = get_active_composition_role(obj)
        if not role:
            return None
        if role == "RPM":
            return "rp"
        return role.lower()

    def get_composition_validation_est_urgent(self, obj):
        from apps.ouverture_offre.services.composition_validation_service import (
            is_composition_urgent,
        )

        return is_composition_urgent(obj)

class ValidationMembreSerializer(serializers.Serializer):
    commentaire = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate_password(self, value):
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("Utilisateur non identifié.")
        if not request.user.check_password(value):
            raise serializers.ValidationError("Mot de passe incorrect.")
        return value

class ValidationPresidentSerializer(serializers.Serializer):
    commentaire = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate_password(self, value):
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("Utilisateur non identifié.")
        if not request.user.check_password(value):
            raise serializers.ValidationError("Mot de passe incorrect.")
        return value

class RejetSeanceSerializer(serializers.Serializer):
    commentaire = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(required=True, write_only=True)

    def validate_password(self, value):
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("Utilisateur non identifié.")
        if not request.user.check_password(value):
            raise serializers.ValidationError("Mot de passe incorrect.")
        return value


class ValidationAccessSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["membre", "president"])
    email = serializers.EmailField()
    password = serializers.CharField(required=True, write_only=True)

    def validate_email(self, value):
        return validate_email_typo(value)

    def validate_password(self, value):
        return value.strip()


class ValidationDecisionSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["membre", "president"])
    email = serializers.EmailField()
    password = serializers.CharField(required=True, write_only=True)
    decision = serializers.ChoiceField(
        choices=["VALIDER", "APPROUVER", "REJETER", "REPORTER"],
    )
    commentaire = serializers.CharField(required=False, allow_blank=True)
    date_report = serializers.DateField(required=False, allow_null=True)

    def validate_email(self, value):
        return validate_email_typo(value)

    def validate_password(self, value):
        return value.strip()

    def validate(self, attrs):
        role = attrs["role"]
        decision = attrs["decision"]

        if role == "membre" and decision not in ["VALIDER", "REJETER"]:
            raise serializers.ValidationError({
                "decision": "Un membre peut uniquement valider ou rejeter."
            })
        if role == "president" and decision not in ["APPROUVER", "REJETER", "REPORTER"]:
            raise serializers.ValidationError({
                "decision": "Le president peut approuver, rejeter ou reporter."
            })
        if decision in ["REJETER", "REPORTER"] and not attrs.get("commentaire", "").strip():
            raise serializers.ValidationError({
                "commentaire": "Un commentaire est obligatoire pour rejeter ou reporter."
            })
        if decision == "REPORTER" and not attrs.get("date_report"):
            raise serializers.ValidationError({
                "date_report": "La date de report est obligatoire."
            })

        return attrs
