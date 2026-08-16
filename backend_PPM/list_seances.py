from apps.ouverture_offre.models import SeanceOuverture
from apps.evaluation_offre.services.evaluation_service import compute_dao_statut
from apps.contractualisation.models import Contrat

with open('seances_info.txt', 'w') as f:
    for s in SeanceOuverture.objects.all():
        has_contrat = Contrat.objects.filter(seance=s).exists()
        f.write(f"ID: {s.id} | Ref: {s.reference_dossier} | Statut: {s.statut} | Secretaire: {s.secretaire.username} | Eval Statut: {compute_dao_statut(s)} | Has Contrat: {has_contrat}\n")
print("Done writing seances_info.txt")
