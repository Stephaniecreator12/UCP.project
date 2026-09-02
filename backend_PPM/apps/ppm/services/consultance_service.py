from datetime import datetime, timedelta
from apps.ppm.models.Consultances import Consultance
from apps.ppm.services.procurement_service import delete_service, arreter_service, statut_service


def _consultance_to_dict(obj: Consultance) -> dict:
    return {
        "id": obj.id,
        "ref_code_suivi": obj.ref_code_suivi or "",
        "intitule": obj.intitule or "",
        "agmoxdirection": obj.agmoxdirection or "",
        "montant_estimatif": float(obj.montant_estimatif) if obj.montant_estimatif else 0,
        "methode": obj.methode or "",
        "approche": obj.approche or "",
        "revue": obj.revue or "",
        "forfaitxtemps": obj.forfaitxtemps or "",
        "commentaire": obj.commentaire or "",
        "statut": obj.statut or "",
        "financing_sources": obj.financing_sources or [],
        "reference_bailleur": obj.reference_bailleur or "",
        "project_code": obj.project_code or "",
        "TdR_prevu": obj.TdR_prevu.isoformat() if obj.TdR_prevu else None,
        "ami_prevu": obj.ami_prevu.isoformat() if obj.ami_prevu else None,
        "liste_restreinte_prevu": obj.liste_restreinte_prevu.isoformat() if obj.liste_restreinte_prevu else None,
        "demande_proposition_prevu": obj.demande_proposition_prevu.isoformat() if obj.demande_proposition_prevu else None,
        "date_invitation_prevu": obj.date_invitation_prevu.isoformat() if obj.date_invitation_prevu else None,
        "date_ouverture_prevu": obj.date_ouverture_prevu.isoformat() if obj.date_ouverture_prevu else None,
        "rapport_evaluation_prevu": obj.rapport_evaluation_prevu.isoformat() if obj.rapport_evaluation_prevu else None,
        "ouverture_plis_prevu": obj.ouverture_plis_prevu.isoformat() if obj.ouverture_plis_prevu else None,
        "projet_contrat_prevu": obj.projet_contrat_prevu.isoformat() if obj.projet_contrat_prevu else None,
        "date_signature_prevu": obj.date_signature_prevu.isoformat() if obj.date_signature_prevu else None,
        "date_fin_prevu": obj.date_fin_prevu.isoformat() if obj.date_fin_prevu else None,
        "duree": obj.duree,
        "TdR_reel": obj.TdR_reel.isoformat() if obj.TdR_reel else None,
        "ami_reel": obj.ami_reel.isoformat() if obj.ami_reel else None,
        "liste_restreinte_reel": obj.liste_restreinte_reel.isoformat() if obj.liste_restreinte_reel else None,
        "demande_proposition_reel": obj.demande_proposition_reel.isoformat() if obj.demande_proposition_reel else None,
        "date_invitation_reel": obj.date_invitation_reel.isoformat() if obj.date_invitation_reel else None,
        "date_ouverture_reel": obj.date_ouverture_reel.isoformat() if obj.date_ouverture_reel else None,
        "rapport_evaluation_reel": obj.rapport_evaluation_reel.isoformat() if obj.rapport_evaluation_reel else None,
        "ouverture_plis_reel": obj.ouverture_plis_reel.isoformat() if obj.ouverture_plis_reel else None,
        "projet_contrat_reel": obj.projet_contrat_reel.isoformat() if obj.projet_contrat_reel else None,
        "date_signature_reel": obj.date_signature_reel.isoformat() if obj.date_signature_reel else None,
        "date_fin_reel": obj.date_fin_reel.isoformat() if obj.date_fin_reel else None,
    }


def create_consultance(data: dict) -> Consultance:
    valid_fields = {f.name for f in Consultance._meta.get_fields()}
    defaults = {
        'ref_code_suivi': '',
        'agmoxdirection': '',
        'montant_estimatif': 0,
        'methode': '',
        'approche': '',
        'revue': '',
        'forfaitxtemps': '',
        'commentaire': '',
        'statut': '',
        'financing_sources': [],
        'reference_bailleur': None,
        'project_code': None,
    }
    payload = {**defaults, **{k: v for k, v in data.items() if k in valid_fields}}
    return Consultance.objects.create(**payload)


def update_consultance(consultance_id: int, data: dict) -> Consultance:
    obj = Consultance.objects.get(id=consultance_id)
    for k, v in data.items():
        if hasattr(obj, k):
            setattr(obj, k, v)
    obj.save()
    return obj


def list_consultance() -> list:
    return [_consultance_to_dict(obj) for obj in Consultance.objects.all()]


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
    return statut_service(dates_prevues, dates_reelles)


def delete_consultance_http(request, consultance_id: int):
    return delete_service(request, Consultance, consultance_id)


def stop_consultance_http(request, consultance_id: int):
    return arreter_service(request, Consultance, consultance_id)
