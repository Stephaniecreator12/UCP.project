from datetime import datetime, timedelta
from apps.ppm.models.Travaux import Travaux
from apps.ppm.services.procurement_service import delete_service, arreter_service, statut_service


def _travaux_to_dict(obj: Travaux) -> dict:
    return {
        "id": obj.id,
        "code_suivi": obj.code_suivi or "",
        "intitule": obj.intitule or "",
        "montant_estimatif": float(obj.montant_estimatif) if obj.montant_estimatif else 0,
        "agmo": obj.agmo or "",
        "methode_pm": obj.methode_pm or "",
        "approches": obj.approches or "",
        "revue": obj.revue or "",
        "listesetspecifications": obj.listesetspecifications.isoformat() if obj.listesetspecifications else None,
        "prevu": obj.prevu or "",
        "reel": obj.reel or "",
        "commentaire": obj.commentaire or "",
        "statut": obj.statut or "",
        "financing_sources": obj.financing_sources or [],
        "reference_bailleur": obj.reference_bailleur or "",
        "project_code": obj.project_code or "",
        "dossiers_appel_prevu": obj.dossiers_appel_prevu.isoformat() if obj.dossiers_appel_prevu else None,
        "date_lancement_prevu": obj.date_lancement_prevu.isoformat() if obj.date_lancement_prevu else None,
        "date_ouverture_prevu": obj.date_ouverture_prevu.isoformat() if obj.date_ouverture_prevu else None,
        "rapport_evaluation_prevu": obj.rapport_evaluation_prevu.isoformat() if obj.rapport_evaluation_prevu else None,
        "date_signature_prevu": obj.date_signature_prevu.isoformat() if obj.date_signature_prevu else None,
        "date_livraison_prevu": obj.date_livraison_prevu.isoformat() if obj.date_livraison_prevu else None,
        "duree": obj.duree,
        "dossiers_appel_reel": obj.dossiers_appel_reel.isoformat() if obj.dossiers_appel_reel else None,
        "date_lancement_reel": obj.date_lancement_reel.isoformat() if obj.date_lancement_reel else None,
        "date_ouverture_reel": obj.date_ouverture_reel.isoformat() if obj.date_ouverture_reel else None,
        "rapport_evaluation_reel": obj.rapport_evaluation_reel.isoformat() if obj.rapport_evaluation_reel else None,
        "date_signature_reel": obj.date_signature_reel.isoformat() if obj.date_signature_reel else None,
        "date_livraison_reel": obj.date_livraison_reel.isoformat() if obj.date_livraison_reel else None,
    }


def create_travaux(data: dict) -> Travaux:
    valid_fields = {f.name for f in Travaux._meta.get_fields()}
    defaults = {
        "code_suivi": "",
        "montant_estimatif": 0,
        "agmo": "",
        "methode_pm": "",
        "approches": "",
        "revue": "",
        "prevu": "",
        "reel": "",
        "commentaire": "",
        "statut": "",
        "financing_sources": [],
        "reference_bailleur": None,
        "project_code": None,
    }
    payload = {**defaults, **{k: v for k, v in data.items() if k in valid_fields}}
    return Travaux.objects.create(**payload)


def update_travaux(travaux_id: int, data: dict) -> Travaux:
    obj = Travaux.objects.get(id=travaux_id)
    for k, v in data.items():
        if hasattr(obj, k):
            setattr(obj, k, v)
    obj.save()
    return obj


def list_travaux() -> list:
    return [_travaux_to_dict(obj) for obj in Travaux.objects.all()]


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
