from datetime import datetime, timedelta
from apps.ppm.models.Consultances import Consultance
from apps.ppm.services.procurement_service import delete_service, arreter_service, statut_service

def create_consultance(data: dict) -> Consultance:
    defaults = {
        'ref_code_suivi': 'Code Suivi par défaut',
        'agmoxdirection': 'Direction Générale',
        'montant_estimatif': 1000000.00,
        'methode': "Appel d'offres",
        'approche': 'Approche 1',
        'revue': 'Revue préalable',
        'forfaitxtemps': 'Forfait',
        'commentaire': 'Remarque par défaut',
        'statut': 'En cours',
        # dates prévues par défaut
        'TdR_prevu': '2026-01-01',
        'ami_prevu': '2026-01-01',
        'liste_restreinte_prevu': '2026-01-01',
        'demande_proposition_prevu': '2026-01-01',
        'date_invitation_prevu': '2026-01-01',
        'date_ouverture_prevu': '2026-01-01',
        'rapport_evaluation_prevu': '2026-01-01',
        'ouverture_plis_prevu': '2026-01-01',
        'projet_contrat_prevu': '2026-01-01',
        'date_signature_prevu': '2026-01-01',
        'date_fin_prevu': '2026-01-01',
    }
    payload = {**defaults, **data}
    return Consultance.objects.create(**payload)

def update_consultance(consultance_id: int, data: dict) -> Consultance:
    obj = Consultance.objects.get(id=consultance_id)
    for k, v in data.items():
        if hasattr(obj, k):
            setattr(obj, k, v)
    obj.save()
    return obj

def list_consultance() -> list:
    return list(Consultance.objects.values())

def compute_planning_consultance(date_fin_str: str, methode: str = "SMC", duree: int = 60) -> dict:
    if not date_fin_str:
        raise ValueError("La date de fin est obligatoire")
    date_fin = datetime.strptime(date_fin_str, '%Y-%m-%d')
    date_signature = date_fin - timedelta(days=duree)
    configs = {
        'SMC':  (133, 28, 77, 91, 98, 119),
        'SFQC': (133, 28, 70, 84, 91, 112),
        'SQC':  (70, 7, 20, 30, 35, 49),
        'SED':  (70, 7, 20, 30, 35, 49),
        'SCI':  (70, 7, 20, 30, 35, 49),
    }
    methode = methode.upper()
    if methode not in configs:
        raise ValueError(f"Méthode '{methode}' non supportée")
    tdr_offset, ami_off, dem_off, rapp_off, ouv_off, proj_off = configs[methode]
    tdr = date_signature - timedelta(days=tdr_offset)
    return {
        'TdR_prevu': tdr.strftime('%Y-%m-%d'),
        'ami_prevu': (tdr + timedelta(days=ami_off)).strftime('%Y-%m-%d'),
        'demande_proposition_prevu': (tdr + timedelta(days=dem_off)).strftime('%Y-%m-%d'),
        'date_ouverture_prevu': (tdr + timedelta(days=dem_off)).strftime('%Y-%m-%d'),
        'rapport_evaluation_prevu': (tdr + timedelta(days=rapp_off)).strftime('%Y-%m-%d'),
        'ouverture_plis_prevu': (tdr + timedelta(days=ouv_off)).strftime('%Y-%m-%d'),
        'projet_contrat_prevu': (tdr + timedelta(days=proj_off)).strftime('%Y-%m-%d'),
        'date_signature_prevu': date_signature.strftime('%Y-%m-%d'),
        'date_fin_prevu': date_fin.strftime('%Y-%m-%d'),
    }

def compute_status_consultance(dates_prevues: dict, dates_reelles: dict, est_arrete: bool = False) -> str:
    # Si tu veux prendre en compte est_arrete, adapte statut_service ou code ici
    return statut_service(dates_prevues, dates_reelles)

def delete_consultance_http(request, consultance_id: int):
    return delete_service(request, Consultance, consultance_id)

def stop_consultance_http(request, consultance_id: int):
    return arreter_service(request, Consultance, consultance_id)
