from rest_framework import serializers

from apps.achats.models import DemandeAchat, DocumentDemande, LigneBesoin


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


class DemandeAchatSerializer(serializers.ModelSerializer):
    lignes_besoin = LigneBesoinSerializer(many=True, required=False)
    documents = DocumentDemandeSerializer(many=True, required=False)

    class Meta:
        model = DemandeAchat
        fields = [
            "id",
            "numero_demande",
            "version",
            "demandeur",
            "unite_technique",
            "statut",
            "categorie_besoin",
            "type_demande",
            "priorite",
            "objet",
            "justification",
            "lien_ptba",
            "service_beneficiaire",
            "ligne_budgetaire",
            "source_financement",
            "cout_total_estime",
            "created_at",
            "updated_at",
            "submitted_at",
            "lignes_besoin",
            "documents",
        ]
        read_only_fields = [
            "id",
            "numero_demande",
            "version",
            "demandeur",
            "statut",
            "cout_total_estime",
            "created_at",
            "updated_at",
            "submitted_at",
        ]

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
                }

                for field_name, error_message in required_fields.items():
                    if not ligne.get(field_name):
                        raise serializers.ValidationError(
                            {"lignes_besoin": f"Ligne {index}: {error_message}"}
                        )

        return attrs
