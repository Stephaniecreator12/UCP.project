# Script de migration pour les versions existantes
# apps/TdrSt/management/commands/backfill_snapshots.py

from django.core.management.base import BaseCommand
from apps.TdrSt.models.TdrSt import TdrStDocumentFileVersion

class Command(BaseCommand):
    help = "Backfill snapshot_data for existing file versions"

    def handle(self, *args, **options):
        versions = TdrStDocumentFileVersion.objects.select_related('document').all()
        
        for version in versions:
            doc = version.document
            version.snapshot_data = {
                "unite_technique": doc.unite_technique,
                "type_document": doc.type_document,
                "categorie_activite": doc.categorie_activite,
                "intitule": doc.intitule,
                "reference_ptba": doc.reference_ptba,
                "periode_debut": str(doc.periode_debut) if doc.periode_debut else None,
                "periode_fin": str(doc.periode_fin) if doc.periode_fin else None,
                "duree_estimee_valeur": doc.duree_estimee_valeur,
                "duree_estimee_unite": doc.duree_estimee_unite,
                "sources_financement": doc.sources_financement,
                "numero_subvention": doc.numero_subvention,
                "ligne_budgetaire": doc.ligne_budgetaire,
                "montant_estime_usd": str(doc.montant_estime_usd) if doc.montant_estime_usd else None,
                "procedure_envisagee": doc.procedure_envisagee,
                "statut": doc.statut,
            }
            version.save(update_fields=["snapshot_data"])
            self.stdout.write(f"Updated version {version.version} of document {doc.id}")