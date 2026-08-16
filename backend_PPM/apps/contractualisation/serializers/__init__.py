from rest_framework import serializers
from decimal import Decimal

from ..models import Contrat, EcheancierPaiement, DocumentContrat, AuditTrailContrat


class EcheancierPaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcheancierPaiement
        fields = [
            "id",
            "montant",
            "pourcentage",
            "etape",
            "date_prevue",
            "statut",
            "created_at",
        ]


class DocumentContratSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentContrat
        fields = [
            "id",
            "type_document",
            "fichier",
            "hash_sha256",
            "date_upload",
            "uploaded_by",
        ]
        read_only_fields = ["hash_sha256", "date_upload", "uploaded_by"]


class AuditTrailContratSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.CharField(
        source="utilisateur.get_full_name",
        read_only=True,
    )
    action_label = serializers.CharField(
        source="get_action_display",
        read_only=True,
    )

    class Meta:
        model = AuditTrailContrat
        fields = [
            "id",
            "action",
            "action_label",
            "utilisateur",
            "utilisateur_nom",
            "timestamp",
            "description",
            "ancienne_valeur",
            "nouvelle_valeur",
            "champ_modifie",
            "ip_adresse",
            "navigateur",
        ]
        read_only_fields = [
            "id",
            "timestamp",
            "utilisateur",
            "ip_adresse",
            "navigateur",
        ]


class ContratListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les listes"""

    seance_reference = serializers.CharField(
        source="seance.reference_dossier",
        read_only=True,
    )
    seance_objet = serializers.CharField(
        source="seance.objet_dossier",
        read_only=True,
    )
    offre_soumissionnaire = serializers.CharField(
        source="offre_gagnante.nom_soumissionnaire",
        read_only=True,
    )
    statut_label = serializers.CharField(
        source="get_statut_display",
        read_only=True,
    )

    class Meta:
        model = Contrat
        fields = [
            "id",
            "numero_marche",
            "seance_reference",
            "seance_objet",
            "offre_soumissionnaire",
            "nom_prestataire",
            "statut",
            "statut_label",
            "montant_ttc",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["numero_marche", "created_at", "updated_at"]


class ContratDetailSerializer(serializers.ModelSerializer):
    """Serializer complet avec relations"""

    seance_reference = serializers.CharField(
        source="seance.reference_dossier",
        read_only=True,
    )
    seance_objet = serializers.CharField(
        source="seance.objet_dossier",
        read_only=True,
    )
    offre_soumissionnaire = serializers.CharField(
        source="offre_gagnante.nom_soumissionnaire",
        read_only=True,
    )
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )
    statut_label = serializers.CharField(
        source="get_statut_display",
        read_only=True,
    )

    echeancier = EcheancierPaiementSerializer(many=True, read_only=True)
    documents = DocumentContratSerializer(many=True, read_only=True)
    audit_trail = AuditTrailContratSerializer(many=True, read_only=True)

    class Meta:
        model = Contrat
        fields = [
            "id",
            "numero_marche",
            "statut",
            "statut_label",
            "seance_reference",
            "seance_objet",
            "offre_soumissionnaire",
            "nom_prestataire",
            "email_prestataire",
            "telephone_prestataire",
            "nif_prestataire",
            "stat_prestataire",
            "representant_signataire",
            "montant_ttc",
            "date_signature",
            "duree_execution",
            "clauses_particulieres",
            "created_by_username",
            "created_at",
            "updated_at",
            "echeancier",
            "documents",
            "audit_trail",
        ]
        read_only_fields = [
            "numero_marche",
            "statut",
            "seance_reference",
            "offre_soumissionnaire",
            "created_by_username",
            "created_at",
            "updated_at",
        ]


class ContratCreateSerializer(serializers.Serializer):
    """Serializer pour créer un contrat"""

    seance_id = serializers.IntegerField()
    offre_id = serializers.IntegerField()


class ContratUpdateSerializer(serializers.Serializer):
    """Serializer pour mettre à jour un contrat"""

    email_prestataire = serializers.EmailField(required=False)
    telephone_prestataire = serializers.CharField(required=False, allow_blank=True)
    representant_signataire = serializers.CharField(required=False, allow_blank=True)
    date_signature = serializers.DateField(required=False, allow_null=True)
    duree_execution = serializers.CharField(required=False, allow_blank=True)
    clauses_particulieres = serializers.CharField(required=False, allow_blank=True)


class EcheancierCreateSerializer(serializers.Serializer):
    """Serializer pour ajouter un échéancier"""

    montant = serializers.DecimalField(max_digits=18, decimal_places=2)
    pourcentage = serializers.IntegerField(min_value=1)
    etape = serializers.CharField(max_length=200)
    date_prevue = serializers.DateField()
