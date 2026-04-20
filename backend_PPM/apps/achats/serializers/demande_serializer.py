from rest_framework import serializers

from apps.achats.models import (
    DemandeAchat,
    DocumentDemande,
    HistoriqueDemande,
    LigneBesoin,
    ValidationDemande,
)


class LigneBesoinSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneBesoin
        fields = [
            "id",
            "ordre",
            "designation",
            "marque_modele",
            "caracteristiques_techniques",
            "quantite",
            "unite",
            "prix_unitaire_estime",
            "cout_total_estime",
            "lieu_livraison",
            "destinataire_final",
            "type_service",
            "description_service",
            "date_debut",
            "date_fin",
            "duree_estimee",
            "lieu_execution",
            "livrables_attendus",
            "nombre_beneficiaires",
            "quantite_recue",
            "observation_reception",
        ]
        read_only_fields = ["id", "cout_total_estime"]


class DocumentDemandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentDemande
        fields = [
            "id",
            "type_document",
            "fichier",
            "commentaire",
            "uploaded_at",
        ]
        read_only_fields = ["id", "uploaded_at"]


class ValidationDemandeReadSerializer(serializers.ModelSerializer):
    validateur_username = serializers.SerializerMethodField()
    validateur_nom = serializers.SerializerMethodField()
    etape_label = serializers.CharField(source="get_etape_display", read_only=True)
    decision_label = serializers.CharField(source="get_decision_display", read_only=True)
    signature_electronique = serializers.SerializerMethodField()

    class Meta:
        model = ValidationDemande
        fields = [
            "id",
            "etape",
            "etape_label",
            "decision",
            "decision_label",
            "commentaire",
            "donnees_etape",
            "created_at",
            "validateur_username",
            "validateur_nom",
            "signature_electronique",
        ]

    def get_validateur_username(self, obj):
        return obj.validateur.username if obj.validateur else ""

    def get_validateur_nom(self, obj):
        if not obj.validateur:
            return ""

        full_name = obj.validateur.get_full_name().strip()
        return full_name or obj.validateur.username

    def get_signature_electronique(self, obj):
        if not obj.validateur:
            return "Validation électronique"

        display_name = self.get_validateur_nom(obj)
        return f"Signature applicative : {display_name}"


class HistoriqueDemandeSerializer(serializers.ModelSerializer):
    action_label = serializers.CharField(source="get_action_display", read_only=True)
    user_username = serializers.SerializerMethodField()
    user_nom = serializers.SerializerMethodField()

    class Meta:
        model = HistoriqueDemande
        fields = [
            "id",
            "action",
            "action_label",
            "description",
            "metadata",
            "created_at",
            "user_username",
            "user_nom",
        ]

    def get_user_username(self, obj):
        return obj.user.username if obj.user else ""

    def get_user_nom(self, obj):
        if not obj.user:
            return ""

        full_name = obj.user.get_full_name().strip()
        return full_name or obj.user.username


class DemandeAchatSerializer(serializers.ModelSerializer):
    lignes_besoin = LigneBesoinSerializer(many=True, required=False)
    documents = DocumentDemandeSerializer(many=True, required=False)
    validations = ValidationDemandeReadSerializer(many=True, read_only=True)
    historiques = HistoriqueDemandeSerializer(many=True, read_only=True)
    demandeur_nom = serializers.SerializerMethodField()
    demandeur_group = serializers.SerializerMethodField()

    class Meta:
        model = DemandeAchat
        fields = [
            "id",
            "numero_demande",
            "version",
            "demandeur",
            "demandeur_nom",
            "demandeur_group",
            "unite_technique",
            "statut",
            "etape_validation_actuelle",
            "categorie_besoin",
            "type_demande",
            "priorite",
            "objet",
            "justification",
            "lien_ptba",
            "service_beneficiaire",
            "ligne_budgetaire",
            "source_financement",
            "numero_subvention",
            "solde_disponible_ligne_budgetaire",
            "numero_engagement_budgetaire",
            "solde_apres_engagement",
            "cout_total_estime",
            "type_procedure",
            "fournisseur_retenu",
            "email_fournisseur",
            "numero_bon_commande",
            "date_bon_commande",
            "montant_commande",
            "delai_livraison_contractuel",
            "date_livraison_prevue",
            "conditions_livraison",
            "garantie",
            "date_arrivee_prevue",
            "date_arrivee_effective",
            "etat_expedition",
            "date_reception",
            "receptionnaire",
            "conformite_quantite",
            "conformite_qualite",
            "observations_reception",
            "statut_reception",
            "type_ecart",
            "description_ecart",
            "action_corrective",
            "date_resolution",
            "suivi_resolution",
            "statut_final",
            "date_cloture",
            "niveau_satisfaction",
            "commentaires_finaux",
            "created_at",
            "updated_at",
            "submitted_at",
            "lignes_besoin",
            "documents",
            "validations",
            "historiques",
        ]
        read_only_fields = [
            "id",
            "numero_demande",
            "version",
            "demandeur",
            "demandeur_nom",
            "demandeur_group",
            "statut",
            "ligne_budgetaire",
            "source_financement",
            "cout_total_estime",
            "numero_subvention",
            "solde_disponible_ligne_budgetaire",
            "numero_engagement_budgetaire",
            "solde_apres_engagement",
            "numero_bon_commande",
            "date_bon_commande",
            "montant_commande",
            "date_livraison_prevue",
            "date_arrivee_prevue",
            "date_cloture",
            "created_at",
            "updated_at",
            "submitted_at",
            "etape_validation_actuelle",
            "validations",
            "historiques",
        ]

    def get_demandeur_nom(self, obj):
        if not obj.demandeur:
            return ""
        full_name = obj.demandeur.get_full_name().strip()
        return full_name or obj.demandeur.username

    def get_demandeur_group(self, obj):
        if not obj.demandeur:
            return ""
        groups = list(obj.demandeur.groups.all())
        group = groups[0] if groups else None
        return group.name if group else "Utilisateur"

    def validate(self, attrs):
        type_demande = attrs.get("type_demande")
        lignes_besoin = attrs.get("lignes_besoin", [])

        if not lignes_besoin:
            raise serializers.ValidationError(
                {"lignes_besoin": "Ajoute au moins une ligne de besoin."}
            )

        for index, ligne in enumerate(lignes_besoin, start=1):
            if type_demande == DemandeAchat.TYPE_MATERIELS:
                required_fields = {
                    "designation": "La designation est obligatoire.",
                    "caracteristiques_techniques": "Les caracteristiques techniques sont obligatoires.",
                    "quantite": "La quantite est obligatoire.",
                    "unite": "L unite est obligatoire.",
                    "lieu_livraison": "Le lieu de livraison est obligatoire.",
                    "destinataire_final": "Le destinataire final est obligatoire.",
                }

                for field_name, error_message in required_fields.items():
                    if not ligne.get(field_name):
                        raise serializers.ValidationError(
                            {"lignes_besoin": f"Ligne {index}: {error_message}"}
                        )

            if type_demande in [
                DemandeAchat.TYPE_PETITS_SERVICES,
                DemandeAchat.TYPE_SERVICES_RECURRENTS,
            ]:
                required_fields = {
                    "type_service": "Le type de service est obligatoire.",
                    "description_service": "La description du service est obligatoire.",
                    "date_debut": "La date de debut est obligatoire.",
                    "date_fin": "La date de fin est obligatoire.",
                    "lieu_execution": "Le lieu d execution est obligatoire.",
                    "livrables_attendus": "Les livrables attendus sont obligatoires.",
                    "prix_unitaire_estime": "Le cout estime est obligatoire.",
                }

                for field_name, error_message in required_fields.items():
                    if not ligne.get(field_name):
                        raise serializers.ValidationError(
                            {"lignes_besoin": f"Ligne {index}: {error_message}"}
                        )

        return attrs


class DemandeAchatListSerializer(serializers.ModelSerializer):
    demandeur_nom = serializers.SerializerMethodField()
    demandeur_group = serializers.SerializerMethodField()
    lignes_count = serializers.SerializerMethodField()
    first_designation = serializers.SerializerMethodField()

    class Meta:
        model = DemandeAchat
        fields = [
            "id",
            "numero_demande",
            "demandeur_nom",
            "demandeur_group",
            "unite_technique",
            "statut",
            "etape_validation_actuelle",
            "categorie_besoin",
            "type_demande",
            "priorite",
            "objet",
            "cout_total_estime",
            "created_at",
            "updated_at",
            "submitted_at",
            "lignes_count",
            "first_designation",
        ]

    def get_lignes_count(self, obj):
        return len(obj.lignes_besoin.all())

    def get_first_designation(self, obj):
        lignes = obj.lignes_besoin.all()
        first_line = lignes[0] if lignes else None
        if not first_line:
            return ""
        return first_line.designation or first_line.description_service

    def get_demandeur_nom(self, obj):
        if not obj.demandeur:
            return ""
        full_name = obj.demandeur.get_full_name().strip()
        return full_name or obj.demandeur.username

    def get_demandeur_group(self, obj):
        if not obj.demandeur:
            return ""
        groups = list(obj.demandeur.groups.all())
        group = groups[0] if groups else None
        return group.name if group else "Utilisateur"


class BudgetEstimationSerializer(serializers.Serializer):
    ligne_budgetaire = serializers.CharField()
    source_financement = serializers.ChoiceField(
        choices=DemandeAchat.SOURCE_FINANCEMENT_CHOICES
    )


class IssueOrderSerializer(serializers.Serializer):
    type_procedure = serializers.ChoiceField(choices=DemandeAchat.TYPE_PROCEDURE_CHOICES)
    fournisseur_retenu = serializers.CharField()
    email_fournisseur = serializers.EmailField()
    montant_commande = serializers.DecimalField(max_digits=14, decimal_places=2)
    delai_livraison_contractuel = serializers.IntegerField(min_value=1)
    conditions_livraison = serializers.CharField(required=False, allow_blank=True)
    garantie = serializers.CharField(required=False, allow_blank=True)
    date_bon_commande = serializers.DateField(required=False)


class UpdateDeliverySerializer(serializers.Serializer):
    date_arrivee_prevue = serializers.DateField(required=False)
    date_arrivee_effective = serializers.DateField(required=False)
    etat_expedition = serializers.ChoiceField(choices=DemandeAchat.ETAT_EXPEDITION_CHOICES)


class LigneReceptionSerializer(serializers.Serializer):
    ligne_id = serializers.IntegerField()
    quantite_recue = serializers.IntegerField(min_value=0)
    observation_reception = serializers.CharField(required=False, allow_blank=True)


class ReceiveDemandeSerializer(serializers.Serializer):
    date_reception = serializers.DateField(required=False)
    receptionnaire = serializers.CharField()
    conformite_quantite = serializers.ChoiceField(
        choices=DemandeAchat.CONFORMITE_QUANTITE_CHOICES
    )
    conformite_qualite = serializers.ChoiceField(
        choices=DemandeAchat.CONFORMITE_QUALITE_CHOICES
    )
    observations_reception = serializers.CharField(required=False, allow_blank=True)
    type_ecart = serializers.ChoiceField(
        choices=DemandeAchat.TYPE_ECART_CHOICES,
        required=False,
        allow_blank=True,
    )
    description_ecart = serializers.CharField(required=False, allow_blank=True)
    action_corrective = serializers.ChoiceField(
        choices=DemandeAchat.ACTION_CORRECTIVE_CHOICES,
        required=False,
        allow_blank=True,
    )
    date_resolution = serializers.DateField(required=False)
    suivi_resolution = serializers.CharField(required=False, allow_blank=True)
    lignes = LigneReceptionSerializer(many=True, required=False)

    def validate(self, attrs):
        quantite_ok = attrs.get("conformite_quantite") == DemandeAchat.CONFORMITE_CONFORME
        qualite_ok = attrs.get("conformite_qualite") == DemandeAchat.CONFORMITE_CONFORME
        issue_detected = not (quantite_ok and qualite_ok)

        if issue_detected:
            missing_fields = [
                field_name
                for field_name in ["type_ecart", "description_ecart", "action_corrective"]
                if not attrs.get(field_name)
            ]
            if missing_fields:
                raise serializers.ValidationError(
                    {
                        "detail": "Un écart a été détecté. Complète le formulaire d'écart.",
                        "missing_fields": missing_fields,
                    }
                )

        return attrs


class ResolveReceptionIssueSerializer(serializers.Serializer):
    date_resolution = serializers.DateField(required=False)
    suivi_resolution = serializers.CharField()


class CloseDemandeSerializer(serializers.Serializer):
    statut_final = serializers.ChoiceField(choices=DemandeAchat.STATUT_FINAL_CHOICES)
    niveau_satisfaction = serializers.IntegerField(min_value=1, max_value=5)
    commentaires_finaux = serializers.CharField(required=False, allow_blank=True)
    date_cloture = serializers.DateField(required=False)
