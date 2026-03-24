from datetime import datetime, timedelta
from apps.ppm.models.Travaux import Travaux
from apps.ppm.services.procurement_service import delete_service, arreter_service, statut_service

def create_travaux(data: dict) -> Travaux:
    defaults = {
        "code_suivi": "Code Suivi par défaut",
        "montant_estimatif": 1000000.00,
        "agmo": "Direction Générale",
        "methode_pm": "Appel d'offres",
        "approches": "Approche 1",
        "revue": "Revue préalable",
        "prevu": "Prévu",
        "reel": "Réel",
        "commentaire": "Remarque par défaut",
        "statut": "En cours",
        "dossiers_appel_prevu": "2026-01-01",
        "date_lancement_prevu": "2026-01-01",
        "date_ouverture_prevu": "2026-01-01",
        "rapport_evaluation_prevu": "2026-01-01",
        "date_signature_prevu": "2026-01-01",
        "date_livraison_prevu": "2026-01-01",
        "dossiers_appel_reel": "2026-01-01",
        "date_lancement_reel": "2026-01-01",
        "date_ouverture_reel": "2026-01-01",
        "rapport_evaluation_reel": "2026-01-01",
        "date_signature_reel": "2026-01-01",
        "date_livraison_reel": "2026-01-01",
    }
    payload = {**defaults, **data}
    return Travaux.objects.create(**payload)


def update_travaux(travaux_id: int, data: dict) -> Travaux:
    obj = Travaux.objects.get(id=travaux_id)
    for k, v in data.items():
        if hasattr(obj, k):
            setattr(obj, k, v)
    obj.save()
    return obj

def list_travaux() -> list:
    return list(Travaux.objects.values())

def compute_planning(date_livr_str: str, methode: str = "AOI", duree: int = 60) -> dict:
    if not date_livr_str:
        raise ValueError("La date de livraison est obligatoire")

    date_livr = datetime.strptime(date_livr_str, "%Y-%m-%d")
    date_signature = date_livr - timedelta(days=duree)

    configs = {
        "AON": (133, 28, 77, 91, 98, 119),
        "AOI": (133, 28, 70, 84, 91, 112),
        "DC": (70, 7, 20, 30, 35, 49),
        "ED": (0, 0, 0, 0, 0, 0),
    }

    methode = methode.upper()
    if methode not in configs:
        raise ValueError(f"Méthode '{methode}' non supportée")

    tdr_offset, ami_off, dem_off, rapp_off, ouv_off, proj_off = configs[methode]
    tdr = date_signature - timedelta(days=tdr_offset)

    return {
        "dossiers_appel_prevu": tdr.strftime("%Y-%m-%d"),
        "date_lancement_prevu": (tdr + timedelta(days=ami_off)).strftime("%Y-%m-%d"),
        "date_ouverture_prevu": (tdr + timedelta(days=dem_off)).strftime("%Y-%m-%d"),
        "rapport_evaluation_prevu": (tdr + timedelta(days=rapp_off)).strftime("%Y-%m-%d"),
        "date_signature_prevu": date_signature.strftime("%Y-%m-%d"),
        "date_livraison_prevu": date_livr.strftime("%Y-%m-%d"),
    }

def compute_status(dates_prevues: dict, dates_reelles: dict) -> str:
    return statut_service(dates_prevues, dates_reelles)


def delete_travaux_http(request, travaux_id: int):
    return delete_service(request, Travaux, travaux_id)

def stop_travaux_http(request, travaux_id: int):
    return arreter_service(request, Travaux, travaux_id)
