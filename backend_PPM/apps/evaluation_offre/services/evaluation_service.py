from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework.exceptions import PermissionDenied, ValidationError
from decimal import Decimal
import re
import secrets

from apps.ouverture_offre.models import OffreOuverture, SeanceOuverture
from django.utils import timezone

from apps.evaluation_offre.models import (
    EvaluationOffre,
    EvaluationSeanceAssignation,
    ExamenPreliminaire,
    EvaluationTechnique,
    EvaluationFinanciere,
    EvaluationConclusion,
    DecisionFinale,
    AuditTrail,
    StatutEvaluation,
    StatutDaoEvaluation,
)
from .validation_access_service import (
    issue_evaluation_password,
    issue_seance_password,
    revoke_seance_passwords,
    authenticate_seance_assignation,
)

User = get_user_model()
EVALUATEUR_GROUP = "EVALUATEUR"


# ============================================================
# HELPERS
# ============================================================

def _log_audit(
    utilisateur: object,
    table: str,
    id_enreg: int,
    action: str,
    champ: str = "",
    old_val: object = None,
    new_val: object = None,
) -> None:
    """
    Crée une ligne dans AuditTrail à chaque modification.
    Obligatoire Fonds Mondial.
    On convertit tout en str() pour éviter les erreurs de type.
    """
    AuditTrail.objects.create(
        utilisateur=utilisateur,
        table_modifiee=table,
        id_enregistrement=id_enreg,
        action=action,
        champ_modifie=champ,
        ancienne_valeur=str(old_val) if old_val is not None else "",
        nouvelle_valeur=str(new_val) if new_val is not None else "",
    )


def _split_member_name(full_name: str):
    parts = (full_name or "").strip().split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def _unique_username_from_email(email: str):
    base = re.sub(r"[^a-zA-Z0-9_@.+-]", "", email.split("@", 1)[0]).strip()
    base = base or "evaluateur"
    username = base
    counter = 1
    while User.objects.filter(username=username).exists():
        counter += 1
        username = f"{base}{counter}"
    return username


def _temporary_password():
    return secrets.token_urlsafe(9)


def _ensure_evaluateur_group(user):
    group, _created = Group.objects.get_or_create(name=EVALUATEUR_GROUP)
    user.groups.add(group)


def _snapshot_from_user(user):
    full_name = f"{user.first_name} {user.last_name}".strip() or user.username
    return {
        "evaluateur_nom_prenom": full_name,
        "evaluateur_email": user.email or "",
        "evaluateur_entite": "",
        "evaluateur_poste": "",
        "evaluateur_numero_carte": "",
    }


def _get_or_create_evaluateur_from_member(member: dict):
    email = member["email"].strip().lower()
    full_name = member.get("nomPrenom", "").strip()
    first_name, last_name = _split_member_name(full_name)
    user = User.objects.filter(email__iexact=email).first()
    generated_password = ""

    if user:
        changed_fields = []
        if first_name and not user.first_name:
            user.first_name = first_name
            changed_fields.append("first_name")
        if last_name and not user.last_name:
            user.last_name = last_name
            changed_fields.append("last_name")
        if not user.is_active:
            raise ValidationError({
                "commission_members": f"Le compte lie a {email} est inactif."
            })
        if not user.has_usable_password():
            generated_password = _temporary_password()
            user.set_password(generated_password)
            changed_fields.append("password")
        if changed_fields:
            user.save(update_fields=changed_fields)
    else:
        generated_password = _temporary_password()
        user = User(
            username=_unique_username_from_email(email),
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_active=True,
        )
        user.set_password(generated_password)
        user.save()

    _ensure_evaluateur_group(user)
    return user, generated_password


def _snapshot_from_member(user, member: dict):
    return {
        "evaluateur_nom_prenom": member.get("nomPrenom", "").strip()
        or _snapshot_from_user(user)["evaluateur_nom_prenom"],
        "evaluateur_email": member.get("email", "").strip().lower() or user.email or "",
        "evaluateur_entite": member.get("entite", "").strip(),
        "evaluateur_poste": member.get("poste", "").strip() or member.get("role", "").strip(),
        "evaluateur_numero_carte": member.get("cin", "").strip(),
    }


def _build_frontend_url(path: str) -> str:
    base_url = getattr(
        settings,
        "FRONTEND_APP_URL",
        getattr(settings, "FRONTEND_URL", "http://localhost:3000"),
    ).rstrip("/")
    return f"{base_url}{path}"


def _build_logo_url() -> str:
    return _build_frontend_url("/ucp-sante-logo-color.png")


def _evaluation_email_template(title, content_html, action_url=None, action_text="Accéder"):
    from html import escape

    action_html = ""
    if action_url:
        action_html = f"""
        <div style="margin-top: 12px;">
            <a href="{escape(action_url, quote=True)}" style="display: inline-block; border-radius: 7px; background-color: #0f766e; color: #ffffff; padding: 8px 14px; text-decoration: none; font-size: 12.5px; font-weight: 700;">
                {escape(action_text)}
            </a>
        </div>
        """
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 8px 6px; background-color: #f1f5f9; color: #334155; font-family: 'Segoe UI', system-ui, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #dbe3ea; border-radius: 10px; background-color: #ffffff; overflow: hidden;">
            <div style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                <div style="display: inline-block; border-radius: 999px; background-color: #ecfdf5; color: #047857; padding: 3px 7px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
                    UCP Évaluation
                </div>
                <h1 style="margin: 4px 0 0; color: #0f172a; font-size: 17px; line-height: 1.15; font-weight: 700;">
                    {escape(title)}
                </h1>
            </div>
            <div style="padding: 12px 16px 10px; color: #475569; font-size: 13px; line-height: 1.45;">
                {content_html}
                {action_html}
            </div>
            <div style="border-top: 1px solid #e2e8f0; background-color: #f8fafc; padding: 8px 16px 10px; color: #64748b; font-size: 10.5px; line-height: 1.35;">
                Message automatique UCP — merci de ne pas répondre.
            </div>
        </div>
    </body>
    </html>
    """


def _notify_evaluateurs_assignment(offre, assignments):
    frontend_url = getattr(settings, "FRONTEND_APP_URL", "http://localhost:3000").rstrip("/")
    subject = f"[UCP Évaluation] Assignation evaluation - {offre.seance.reference_dossier}"
    
    def send_messages():
        for user, login_password, eval_code in assignments:
            if not user.email:
                continue
            
            seance_id = offre.seance_id
            login_url = (
                f"{frontend_url}/evaluation/login"
                f"?seance={seance_id}&email={user.email}"
            )
            
            context = {
                "reference_dossier": offre.seance.reference_dossier,
                "objet_dossier": offre.seance.objet_dossier or "-",
                "nom_soumissionnaire": offre.nom_soumissionnaire or "-",
                "seance_id": seance_id,
                "email": user.email,
                "login_password": login_password,
                "eval_code": eval_code,
                "login_url": login_url,
                "logo_url": _build_logo_url(),
            }
            
            try:
                html_message = render_to_string("emails/evaluation_assignment.html", context)
                plain_message = strip_tags(html_message)
                
                message = EmailMultiAlternatives(
                    subject=subject,
                    body=plain_message,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    to=[user.email],
                )
                message.attach_alternative(html_message, "text/html")
                message.send(fail_silently=True)
            except Exception:
                # Fallback to plain text if rendering template fails
                login_line = (
                    f"\nMot de passe temporaire (login) : {login_password}\n"
                    if login_password
                    else "\nUtilisez votre mot de passe habituel pour vous connecter.\n"
                )
                eval_line = (
                    f"\nCode d'accès evaluation : {eval_code}\n" if eval_code else ""
                )
                body = (
                    "Bonjour,\n\n"
                    "Vous avez ete assigne a l'evaluation d'une offre.\n\n"
                    f"Dossier : {offre.seance.reference_dossier}\n"
                    f"Objet : {offre.seance.objet_dossier or '-'}\n"
                    f"Soumissionnaire : {offre.nom_soumissionnaire}\n"
                    f"Lien : {login_url}\n"
                    f"Identifiant : {user.username}\n"
                    f"{login_line}\n"
                    f"{eval_line}\n"
                    "Module : Evaluation des offres.\n"
                )
                send_mail(
                    subject,
                    body,
                    getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    [user.email],
                    fail_silently=True,
                )

    transaction.on_commit(send_messages)


def _notify_evaluateurs_seance_assignment(seance, assignments):
    """Envoie 1 email par évaluateur avec mdp unique DAO."""
    from html import escape

    from apps.achats.services.notification_service import _render_email_details

    frontend_url = getattr(settings, "FRONTEND_APP_URL", "http://localhost:3000").rstrip("/")
    subject = f"Assignation évaluation — {seance.reference_dossier}"
    nb_offres = seance.offres.count()
    date_eval = ""
    heure_eval = ""
    if assignments:
        assignation = assignments[0][0]
        if assignation.date_evaluation:
            date_eval = assignation.date_evaluation.strftime("%d/%m/%Y")
        if assignation.heure_evaluation:
            heure_eval = assignation.heure_evaluation.strftime("%H:%M")

    def send_messages():
        for assignation, dao_password in assignments:
            user = assignation.evaluateur
            if not user.email and not assignation.evaluateur_email:
                continue
            recipient = assignation.evaluateur_email or user.email
            login_url = (
                f"{frontend_url}/evaluation/login"
                f"?seance={seance.id}&email={recipient}"
            )
            debut_label = (
                f"{date_eval} à {heure_eval}"
                if date_eval and heure_eval
                else date_eval or "À convenir"
            )
            html_content = f"""
                <p style="margin: 0 0 8px;">Bonjour,</p>
                <p style="margin: 0 0 8px;">
                    Vous êtes désigné(e) évaluateur pour le DAO
                    <strong>{escape(seance.reference_dossier)}</strong>.
                </p>
                <p style="margin: 0 0 10px;">L'évaluation débute à la date indiquée ci-dessous.</p>
                {_render_email_details([
                    ("N° DAO", seance.reference_dossier, "accent"),
                    ("Objet", seance.objet_dossier or "-", "default"),
                    ("Offres à évaluer", f"{nb_offres}", "default"),
                    ("Début évaluation", debut_label, "warning"),
                    ("Mot de passe d'accès", dao_password, "accent"),
                    ("Votre email", recipient, "default"),
                ])}
            """
            try:
                html_message = _evaluation_email_template(
                    "Assignation évaluation",
                    html_content,
                    login_url,
                    "Accéder à l'évaluation",
                )
                plain_message = strip_tags(html_message)
                message = EmailMultiAlternatives(
                    subject=subject,
                    body=plain_message,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    to=[recipient],
                )
                message.attach_alternative(html_message, "text/html")
                message.send(fail_silently=True)
            except Exception:
                body = (
                    "Bonjour,\n\n"
                    f"Vous êtes désigné évaluateur pour {seance.reference_dossier}.\n"
                    f"Début : {debut_label}\n"
                    f"Mot de passe : {dao_password}\n"
                    f"Lien : {login_url}\n"
                )
                send_mail(
                    subject,
                    body,
                    getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    [recipient],
                    fail_silently=True,
                )

    transaction.on_commit(send_messages)


def _get_evaluation_or_403(offre_id: int, user: object) -> "EvaluationOffre":
    """
    Récupère l'évaluation de CET évaluateur pour CETTE offre.
    Lève 403 si l'évaluateur n'est pas assigné.
    """
    evaluation = EvaluationOffre.objects.filter(
        offre_id=offre_id,
        evaluateur=user,
    ).select_related("offre", "evaluateur").first()

    if not evaluation:
        raise PermissionDenied({
            "detail": "Vous n'êtes pas assigné à l'évaluation de cette offre."
        })
    return evaluation


def _technique_est_complete(tech: EvaluationTechnique | None) -> bool:
    if not tech:
        return False
    notes = [
        tech.note_conformite_technique,
        tech.note_delai_livraison,
        tech.note_experience,
        tech.note_sav_garantie,
    ]
    return all(note is not None for note in notes)


def _examen_est_complete(evaluation: "EvaluationOffre") -> bool:
    return ExamenPreliminaire.objects.filter(evaluation=evaluation).exists()


def _technical_gate(offre: "OffreOuverture") -> tuple[bool, str]:
    evaluations = EvaluationOffre.objects.filter(offre=offre)
    if evaluations.count() < 3:
        return False, "Les 3 évaluateurs doivent être assignés."

    for eval_obj in evaluations:
        if not _examen_est_complete(eval_obj):
            return (
                False,
                "En attente de la finalisation de l'examen préliminaire par les 3 évaluateurs.",
            )

    return True, ""


def _compute_evaluateurs_avancement(offre: "OffreOuverture") -> list:
    evaluations = list(
        EvaluationOffre.objects
        .filter(offre=offre)
        .order_by("evaluateur_id")
    )
    result = []
    for eval_obj in evaluations[:3]:
        tech = EvaluationTechnique.objects.filter(evaluation=eval_obj).first()
        result.append({
            "nom": eval_obj.evaluateur_nom_prenom or eval_obj.evaluateur_email,
            "examen_termine": _examen_est_complete(eval_obj),
            "technique_termine": _technique_est_complete(tech),
        })
    return result


def _check_technique_done_for_all(offre: "OffreOuverture") -> None:
    """
    Double aveugle : la financière n'est accessible que lorsque
    les 3 évaluateurs ont soumis leurs notes techniques.
    """
    evaluations = EvaluationOffre.objects.filter(offre=offre)

    if evaluations.count() < 3:
        raise ValidationError({
            "detail": "Les 3 évaluateurs doivent être assignés avant l'évaluation financière."
        })

    for eval_obj in evaluations:
        tech = EvaluationTechnique.objects.filter(evaluation=eval_obj).first()
        if not _technique_est_complete(tech):
            raise ValidationError({
                "detail": "Tous les évaluateurs doivent compléter la partie technique d'abord."
            })


def _financial_gate(offre: "OffreOuverture") -> tuple[bool, str]:
    evaluations = EvaluationOffre.objects.filter(offre=offre)
    if evaluations.count() < 3:
        return False, "Les 3 évaluateurs doivent être assignés."

    for eval_obj in evaluations:
        tech = EvaluationTechnique.objects.filter(evaluation=eval_obj).first()
        if not _technique_est_complete(tech):
            return False, "En attente de la validation technique des 3 évaluateurs."

    return True, ""


def _compute_consensus_info(offre: "OffreOuverture") -> dict:
    scores = []
    for eval_obj in EvaluationOffre.objects.filter(offre=offre):
        tech = EvaluationTechnique.objects.filter(evaluation=eval_obj).first()
        if tech and tech.score_technique_total is not None:
            scores.append(float(tech.score_technique_total))

    if len(scores) < 2:
        return {"alerte": False, "ecart_max": 0, "scores": scores}

    ecart_max = max(abs(scores[i] - scores[j]) for i in range(len(scores)) for j in range(i + 1, len(scores)))
    return {
        "alerte": ecart_max > 15,
        "ecart_max": round(ecart_max, 2),
        "scores": scores,
    }


def _compute_progress_status(evaluation: "EvaluationOffre") -> str:
    try:
        conclusion = evaluation.conclusion
        if conclusion.signe_le:
            return "TERMINEE"
    except EvaluationConclusion.DoesNotExist:
        pass

    has_data = False
    if ExamenPreliminaire.objects.filter(evaluation=evaluation).exists():
        has_data = True
    if EvaluationTechnique.objects.filter(evaluation=evaluation).exists():
        has_data = True
    if EvaluationFinanciere.objects.filter(evaluation=evaluation).exists():
        has_data = True
    if EvaluationConclusion.objects.filter(evaluation=evaluation).exists():
        has_data = True

    return "EN_COURS" if has_data else "PAS_COMMENCE"


def _compute_moins_disant(seance_id: int, evaluateur: object) -> Decimal | None:
    montants: list[float] = []
    offres = OffreOuverture.objects.filter(seance_id=seance_id)
    for offre in offres:
        evaluation = EvaluationOffre.objects.filter(offre=offre, evaluateur=evaluateur).first()
        if not evaluation:
            continue
        fin = EvaluationFinanciere.objects.filter(evaluation=evaluation).first()
        if fin and fin.montant_evalue_final:
            montants.append(float(fin.montant_evalue_final))

    if not montants:
        for offre in offres:
            if offre.montant_global:
                montants.append(float(offre.montant_global))

    if not montants:
        return None
    return Decimal(str(min(montants)))


def _update_evaluation_statut(evaluation: "EvaluationOffre") -> None:
    progress = _compute_progress_status(evaluation)
    if progress == "TERMINEE":
        evaluation.statut = StatutEvaluation.COMPLETE
    else:
        evaluation.statut = StatutEvaluation.EN_COURS
    evaluation.save(update_fields=["statut", "updated_at"])


# ============================================================
# LECTURE
# ============================================================

def list_offres_a_evaluer(user: object):
    return (
        EvaluationOffre.objects
        .filter(evaluateur=user)
        .select_related("offre", "offre__seance")
        .order_by("-created_at")
    )


def list_offres_a_assigner(user: object):
    return (
        OffreOuverture.objects
        .filter(seance__statut="VALIDEE")
        .select_related("seance")
        .prefetch_related(
            "evaluations__evaluateur",
            "evaluations__evaluation_technique",
            "evaluations__evaluation_financiere",
            "evaluations__examen_preliminaire",
            "evaluations__conclusion",
        )
        .order_by("-seance__created_at", "ordre_passage")
    )


def compute_offre_statut_dashboard(offre: "OffreOuverture") -> str:
    evaluations = list(EvaluationOffre.objects.filter(offre=offre))
    if len(evaluations) < 3:
        return "A_ASSIGNER"

    completes = [e for e in evaluations if e.statut == StatutEvaluation.COMPLETE]
    if len(completes) == 3:
        recos = []
        for evaluation in evaluations:
            try:
                if evaluation.conclusion.recommandation:
                    recos.append(evaluation.conclusion.recommandation)
            except EvaluationConclusion.DoesNotExist:
                continue
        attribuer = sum(1 for r in recos if r == "ATTRIBUER")
        rejeter = sum(1 for r in recos if r == "REJETER")
        if attribuer >= 2:
            return "VALIDEE"
        if rejeter >= 2:
            return "REJETEE"

    non_conformes = 0
    for evaluation in evaluations:
        try:
            if not evaluation.examen_preliminaire.est_conforme:
                non_conformes += 1
        except ExamenPreliminaire.DoesNotExist:
            continue
    if non_conformes >= 2:
        return "NON_CONFORME"

    tech_scores = []
    for evaluation in evaluations:
        try:
            score = evaluation.evaluation_technique.score_technique_total
            if score is not None:
                tech_scores.append(float(score))
        except EvaluationTechnique.DoesNotExist:
            continue
    if len(tech_scores) == 3 and (sum(tech_scores) / 3) < 70:
        return "ELIMINEE"

    if _compute_consensus_info(offre)["alerte"]:
        return "CONSENSUS_REQUIS"

    return "EN_EVALUATION"


def get_evaluation_detail(offre_id: int, user: object) -> "EvaluationOffre":
    evaluation = (
        EvaluationOffre.objects
        .filter(offre_id=offre_id, evaluateur=user)
        .select_related("offre", "offre__seance", "evaluateur")
        .first()
    )
    if not evaluation:
        raise PermissionDenied({
            "detail": "Vous n'êtes pas assigné à l'évaluation de cette offre."
        })
    return evaluation


def list_dao_offres(seance_id: int, user: object) -> dict:
    assignation = EvaluationSeanceAssignation.objects.filter(
        seance_id=seance_id,
        evaluateur=user,
        evaluation_password_revoked_at__isnull=True,
    ).first()
    if not assignation:
        legacy = EvaluationOffre.objects.filter(
            evaluateur=user,
            offre__seance_id=seance_id,
        ).exists()
        if not legacy:
            raise PermissionDenied({
                "detail": "Vous n'êtes pas assigné à l'évaluation de ce DAO."
            })

    evaluations = (
        EvaluationOffre.objects
        .filter(evaluateur=user, offre__seance_id=seance_id)
        .select_related("offre", "offre__seance")
        .prefetch_related(
            "examen_preliminaire",
            "evaluation_technique",
            "evaluation_financiere",
            "conclusion",
        )
        .order_by("offre__ordre_passage", "offre_id")
    )

    if not evaluations.exists():
        raise PermissionDenied({
            "detail": "Aucune offre assignée pour cette séance."
        })

    seance = evaluations.first().offre.seance
    offres_payload = []
    for evaluation in evaluations:
        offre = evaluation.offre
        peut_fin, blocage = _financial_gate(offre)
        consensus = _compute_consensus_info(offre)
        offres_payload.append({
            "offre_id": offre.id,
            "ordre_passage": offre.ordre_passage,
            "nom_soumissionnaire": offre.nom_soumissionnaire,
            "montant_global": offre.montant_global,
            "lot_numero": offre.lot_numero,
            "nif_stat": offre.nif_stat,
            "progression": _compute_progress_status(evaluation),
            "peut_saisir_financiere": peut_fin,
            "blocage_financier": blocage,
            "consensus_alerte": consensus["alerte"],
            "consensus_ecart": consensus["ecart_max"],
        })

    return {
        "seance_id": seance.id,
        "reference_dossier": seance.reference_dossier,
        "objet_dossier": seance.objet_dossier,
        "date_seance": seance.date_seance,
        "offres": offres_payload,
    }


# ============================================================
# DAO — STATUTS ET DASHBOARD SECRÉTAIRE
# ============================================================

def _offre_terminee_par_tous(offre: OffreOuverture) -> bool:
    assignations = EvaluationSeanceAssignation.objects.filter(seance=offre.seance)
    if assignations.count() < 3:
        evaluations = EvaluationOffre.objects.filter(offre=offre)
        if evaluations.count() < 3:
            return False
        assignations = None

    evaluateurs = (
        [a.evaluateur_id for a in assignations]
        if assignations is not None
        else list(EvaluationOffre.objects.filter(offre=offre).values_list("evaluateur_id", flat=True))
    )
    if len(set(evaluateurs)) < 3:
        return False

    for evaluateur_id in set(evaluateurs):
        evaluation = EvaluationOffre.objects.filter(offre=offre, evaluateur_id=evaluateur_id).first()
        if not evaluation:
            return False
        try:
            if not evaluation.conclusion.signe_le:
                return False
        except EvaluationConclusion.DoesNotExist:
            return False
    return True


def _count_offres_terminees_seance(seance: SeanceOuverture) -> int:
    return sum(1 for offre in seance.offres.all() if _offre_terminee_par_tous(offre))


def compute_dao_statut(seance: SeanceOuverture) -> str:
    assignations = EvaluationSeanceAssignation.objects.filter(
        seance=seance,
        evaluation_password_revoked_at__isnull=True,
    )
    if assignations.count() < 3:
        legacy = EvaluationOffre.objects.filter(offre__seance=seance).values("evaluateur_id").distinct()
        if legacy.count() < 3:
            return StatutDaoEvaluation.A_ASSIGNER

    offres = list(seance.offres.all())
    if not offres:
        return StatutDaoEvaluation.A_ASSIGNER

    terminees = _count_offres_terminees_seance(seance)
    if terminees == len(offres):
        return StatutDaoEvaluation.TERMINE
    return StatutDaoEvaluation.EN_EVALUATION


def compute_offre_statut_detail(offre: OffreOuverture) -> dict:
    evaluations = list(EvaluationOffre.objects.filter(offre=offre))
    signees = 0
    for evaluation in evaluations:
        try:
            if evaluation.conclusion.signe_le:
                signees += 1
        except EvaluationConclusion.DoesNotExist:
            continue

    consensus = _compute_consensus_info(offre)
    payload = {
        "offre_id": offre.id,
        "ordre_passage": offre.ordre_passage,
        "nom_soumissionnaire": offre.nom_soumissionnaire,
        "montant_global": offre.montant_global,
        "lot_numero": offre.lot_numero,
        "nif_stat": offre.nif_stat,
        "evaluations_signees": signees,
        "evaluations_total": max(len(evaluations), 3),
        "consensus_alerte": consensus["alerte"],
        "consensus_ecart": consensus["ecart_max"],
        "statut_synthese": None,
    }

    if signees >= 3 or _offre_terminee_par_tous(offre):
        payload["statut_synthese"] = compute_offre_statut_dashboard(offre)
    elif signees > 0 or any(
        ExamenPreliminaire.objects.filter(evaluation=e).exists() for e in evaluations
    ):
        payload["progression"] = "EN_COURS"
    else:
        payload["progression"] = "PAS_COMMENCE"

    return payload


def list_dao_dashboard(user: object) -> list:
    seances = (
        SeanceOuverture.objects
        .filter(statut="VALIDEE")
        .prefetch_related("offres", "evaluation_assignations")
        .order_by("-created_at")
    )
    items = []
    for seance in seances:
        nb_offres = seance.offres.count()
        if nb_offres == 0:
            continue
        terminees = _count_offres_terminees_seance(seance)
        statut = compute_dao_statut(seance)
        items.append({
            "seance_id": seance.id,
            "reference_dossier": seance.reference_dossier,
            "objet_dossier": seance.objet_dossier,
            "date_seance": seance.date_seance,
            "statut_dao": statut,
            "nb_offres": nb_offres,
            "offres_terminees": terminees,
            "evaluateurs_assignes": EvaluationSeanceAssignation.objects.filter(seance=seance).count(),
        })
    return items


def _get_date_limite_soumission(seance: SeanceOuverture):
    try:
        from apps.procurement.models import ProcurementMarket

        market = ProcurementMarket.objects.filter(
            reference_number=seance.reference_dossier,
        ).first()
        if market and market.deadline:
            return market.deadline.isoformat()
    except Exception:
        pass
    return None


def get_dao_detail(seance_id: int, user: object) -> dict:
    seance = (
        SeanceOuverture.objects
        .filter(pk=seance_id, statut="VALIDEE")
        .prefetch_related("offres", "evaluation_assignations__evaluateur")
        .first()
    )
    if not seance:
        raise ValidationError({"detail": "DAO introuvable."})

    assignations = list(seance.evaluation_assignations.all())
    offres = [compute_offre_statut_detail(offre) for offre in seance.offres.all()]
    first_assign = assignations[0] if assignations else None

    return {
        "seance_id": seance.id,
        "reference_dossier": seance.reference_dossier,
        "objet_dossier": seance.objet_dossier,
        "date_seance": seance.date_seance,
        "lieu": seance.lieu,
        "heure_seance": seance.heure_seance.isoformat() if seance.heure_seance else None,
        "observations": seance.observations,
        "secretaire_nom": seance.secretaire.get_full_name() or seance.secretaire.username if seance.secretaire else None,
        "secretaire_email": seance.secretaire.email if seance.secretaire else None,
        "date_limite_soumission": _get_date_limite_soumission(seance),
        "date_evaluation": first_assign.date_evaluation if first_assign else None,
        "heure_evaluation": (
            first_assign.heure_evaluation.isoformat()
            if first_assign and first_assign.heure_evaluation
            else None
        ),
        "statut_dao": compute_dao_statut(seance),
        "nb_offres": len(offres),
        "offres_terminees": _count_offres_terminees_seance(seance),
        "evaluateurs": [
            {
                "id": a.id,
                "nom": a.evaluateur_nom_prenom,
                "email": a.evaluateur_email,
                "entite": a.evaluateur_entite,
                "poste": a.evaluateur_poste,
                "mdp_actif": bool(a.evaluation_password_hash) and not a.evaluation_password_revoked_at,
            }
            for a in assignations
        ],
        "offres": offres,
    }


def _maybe_finalize_seance(seance_id: int) -> None:
    seance = SeanceOuverture.objects.filter(pk=seance_id).first()
    if not seance:
        return
    if compute_dao_statut(seance) != StatutDaoEvaluation.TERMINE:
        return
    revoke_seance_passwords(seance_id)


def login_evaluateur_dao(email: str, password: str, seance_id: int | None = None) -> dict:
    from rest_framework_simplejwt.tokens import RefreshToken

    assignation = authenticate_seance_assignation(email, password, seance_id)
    refresh = RefreshToken.for_user(assignation.evaluateur)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "seance_id": assignation.seance_id,
        "email": assignation.evaluateur_email or assignation.evaluateur.email,
    }


# ============================================================
# ASSIGNATION DES ÉVALUATEURS
# ============================================================

@transaction.atomic
def assigner_evaluateurs(
    offre_id: int,
    user: object,
    evaluateur_ids: list | None = None,
    commission_members: list | None = None,
    lot_numero: str | None = None,
    nif_stat: str | None = None,
    nom_soumissionnaire: str | None = None,
    date_evaluation: object | None = None,
) -> list:
    offre = OffreOuverture.objects.filter(pk=offre_id).first()
    if not offre:
        raise ValidationError({"detail": "Offre introuvable."})

    # Update metadata on OffreOuverture
    if lot_numero is not None:
        offre.lot_numero = lot_numero
    if nif_stat is not None:
        offre.nif_stat = nif_stat
    if nom_soumissionnaire is not None:
        offre.nom_soumissionnaire = nom_soumissionnaire
    offre.save()

    evaluateur_ids = evaluateur_ids or []
    commission_members = commission_members or []

    if bool(evaluateur_ids) == bool(commission_members):
        raise ValidationError({
            "detail": "Fournir soit evaluateur_ids, soit commission_members."
        })

    EvaluationOffre.objects.filter(offre=offre).delete()

    evaluations_to_create = []
    notification_assignments = []

    if evaluateur_ids:
        if len(evaluateur_ids) != 3:
            raise ValidationError({"detail": "Exactement 3 évaluateurs sont requis."})

        if len(set(evaluateur_ids)) != 3:
            raise ValidationError({"detail": "Les 3 évaluateurs doivent être différents."})

        users_by_id = {
            evaluateur.id: evaluateur
            for evaluateur in User.objects.filter(id__in=evaluateur_ids, is_active=True)
        }
        if len(users_by_id) != 3:
            raise ValidationError({"detail": "Un ou plusieurs évaluateurs sont introuvables."})

        for evaluateur_id in evaluateur_ids:
            evaluateur = users_by_id[evaluateur_id]
            _ensure_evaluateur_group(evaluateur)
            evaluations_to_create.append(
                EvaluationOffre(
                    offre=offre,
                    evaluateur=evaluateur,
                    date_evaluation=date_evaluation or None,
                    **_snapshot_from_user(evaluateur),
                )
            )
            notification_assignments.append((evaluateur, ""))

    if commission_members:
        if len(commission_members) != 3:
            raise ValidationError({"detail": "Exactement 3 évaluateurs sont requis."})

        seen_users = set()
        for member in commission_members:
            evaluateur, generated_password = _get_or_create_evaluateur_from_member(member)
            if evaluateur.pk in seen_users:
                raise ValidationError({"detail": "Les 3 évaluateurs doivent être différents."})
            seen_users.add(evaluateur.pk)
            evaluations_to_create.append(
                EvaluationOffre(
                    offre=offre,
                    evaluateur=evaluateur,
                    date_evaluation=date_evaluation or None,
                    **_snapshot_from_member(evaluateur, member),
                )
            )
            notification_assignments.append((evaluateur, generated_password))

    evaluations = EvaluationOffre.objects.bulk_create(evaluations_to_create)

    for eval_obj in evaluations:
        # bulk_create retourne les objets avec pk sur Django 4+
        pk = getattr(eval_obj, "pk", None) or 0
        _log_audit(user, "EvaluationOffre", pk, "CREATE")

    # Après création, on émet un code d'accès d'évaluation par ligne (optionnel)
    assignments_with_codes = []
    for idx, eval_obj in enumerate(evaluations):
        login_password = notification_assignments[idx][1] if idx < len(notification_assignments) else ""
        try:
            eval_code = issue_evaluation_password(eval_obj)
        except Exception:
            eval_code = ""
        assignments_with_codes.append((eval_obj.evaluateur, login_password, eval_code))

    _notify_evaluateurs_assignment(offre, assignments_with_codes)

    return evaluations


# ============================================================
# SECTION 2 : EXAMEN PRÉLIMINAIRE
# ============================================================

@transaction.atomic
def soumettre_examen_preliminaire(offre_id: int, data: dict, user: object):
    evaluation = _get_evaluation_or_403(offre_id, user)

    examen, created = ExamenPreliminaire.objects.get_or_create(evaluation=evaluation)
    old_conforme = examen.est_conforme

    for field in (
        "offre_signee",
        "garantie_conforme",
        "dossier_admin_complet",
        "validite_conforme",
        "conditions_acceptees",
    ):
        if field in data and data[field] is not None:
            setattr(examen, field, bool(data[field]))
    if "commentaire" in data:
        examen.commentaire = data.get("commentaire", "")
    examen.save()

    action = "CREATE" if created else "UPDATE"
    _log_audit(
        user, "ExamenPreliminaire", examen.pk, action,
        champ="est_conforme",
        old_val=old_conforme,
        new_val=examen.est_conforme,
    )
    return examen


# ============================================================
# SECTION 3 : ÉVALUATION TECHNIQUE
# ============================================================

@transaction.atomic
def soumettre_evaluation_technique(offre_id: int, data: dict, user: object):
    evaluation = _get_evaluation_or_403(offre_id, user)

    tech, created = EvaluationTechnique.objects.get_or_create(evaluation=evaluation)
    old_score = tech.score_technique_total

    for field in (
        "note_conformite_technique",
        "note_delai_livraison",
        "note_experience",
        "note_sav_garantie",
    ):
        if field in data and data[field] is not None:
            setattr(tech, field, data[field])
    tech.save()

    action = "CREATE" if created else "UPDATE"
    _log_audit(
        user, "EvaluationTechnique", tech.pk, action,
        champ="score_technique_total",
        old_val=old_score,
        new_val=tech.score_technique_total,
    )
    return tech


# ============================================================
# SECTION 4 : ÉVALUATION FINANCIÈRE (double aveugle)
# ============================================================

@transaction.atomic
def soumettre_evaluation_financiere(offre_id: int, data: dict, user: object):
    evaluation = _get_evaluation_or_403(offre_id, user)

    _check_technique_done_for_all(evaluation.offre)

    fin, created = EvaluationFinanciere.objects.get_or_create(evaluation=evaluation)
    old_score = fin.score_financier

    if data.get("montant_lu") is not None:
        fin.montant_lu = data.get("montant_lu")
    if data.get("corrections_arithmetiques") is not None:
        fin.corrections_arithmetiques = data.get("corrections_arithmetiques")
    elif fin.corrections_arithmetiques is None:
        fin.corrections_arithmetiques = Decimal("0")
    if data.get("rabais_accordes") is not None:
        fin.rabais_accordes = data.get("rabais_accordes")
    elif fin.rabais_accordes is None:
        fin.rabais_accordes = Decimal("0")
    moins_disant = _compute_moins_disant(evaluation.offre.seance_id, user)
    fin.offre_moins_disante = moins_disant
    fin.save()

    action = "CREATE" if created else "UPDATE"
    _log_audit(
        user, "EvaluationFinanciere", fin.pk, action,
        champ="score_financier",
        old_val=old_score,
        new_val=fin.score_financier,
    )
    return fin


# ============================================================
# CONSOLIDATION FINALE
# ============================================================

@transaction.atomic
def consolider_decision_finale(offre_id: int, data: dict, user: object):
    offre = OffreOuverture.objects.filter(pk=offre_id).first()
    if not offre:
        raise ValidationError({"detail": "Offre introuvable."})

    evaluations = EvaluationOffre.objects.filter(offre=offre)

    if evaluations.count() < 3:
        raise ValidationError({"detail": "Les 3 évaluateurs doivent avoir terminé."})

    # Moyenne technique
    scores_tech = []
    for eval_obj in evaluations:
        tech = EvaluationTechnique.objects.filter(evaluation=eval_obj).first()
        if tech and tech.score_technique_total is not None:
            scores_tech.append(float(tech.score_technique_total))

    if len(scores_tech) < 3:
        raise ValidationError({
            "detail": "Tous les évaluateurs doivent compléter l'évaluation technique."
        })

    # Moyenne financière
    scores_fin = []
    for eval_obj in evaluations:
        fin = EvaluationFinanciere.objects.filter(evaluation=eval_obj).first()
        if fin and fin.score_financier is not None:
            scores_fin.append(float(fin.score_financier))

    if len(scores_fin) < 3:
        raise ValidationError({
            "detail": "Tous les évaluateurs doivent compléter l'évaluation financière."
        })

    consensus = _compute_consensus_info(offre)
    if consensus["alerte"]:
        raise ValidationError({
            "detail": (
                f"Consensus requis — écart de {consensus['ecart_max']} pts entre évaluateurs "
                f"(seuil 15 pts). Les évaluateurs doivent ajuster leurs notes avant consolidation."
            ),
        })

    score_tech_moyen = round(sum(scores_tech) / len(scores_tech), 2)
    score_fin_moyen  = round(sum(scores_fin)  / len(scores_fin),  2)

    decision, created = DecisionFinale.objects.get_or_create(offre=offre)
    decision.score_technique_consolide = Decimal(str(score_tech_moyen))
    decision.score_financier_consolide = Decimal(str(score_fin_moyen))
    decision.recommandation            = data.get("recommandation")
    decision.justification             = data.get("justification", "")
    decision.declaration_conflit       = data.get("declaration_conflit", False)
    decision.classement                = data.get("classement")
    decision.save()

    action = "CREATE" if created else "UPDATE"
    _log_audit(
        user, "DecisionFinale", decision.pk, action,
        champ="score_final",
        old_val=None,
        new_val=decision.score_final,
    )

    evaluations.update(statut=StatutEvaluation.COMPLETE)

    # Générer et archiver le rapport PDF final
    try:
        from .pdf_service import generate_and_archive_evaluation_report
        generate_and_archive_evaluation_report(decision)
    except Exception:
        # Ne pas bloquer la consolidation si la génération PDF échoue
        pass

    return decision


# ============================================================
# SAUVEGARDE UNIFIÉE (formulaire évaluateur)
# ============================================================

@transaction.atomic
def sauvegarder_evaluation(offre_id: int, data: dict, user: object) -> "EvaluationOffre":
    evaluation = _get_evaluation_or_403(offre_id, user)

    examen_data = data.get("examen")
    if examen_data:
        soumettre_examen_preliminaire(offre_id, examen_data, user)

    technique_data = data.get("technique")
    if technique_data:
        peut_tech, message_tech = _technical_gate(evaluation.offre)
        if not peut_tech:
            raise ValidationError({"detail": message_tech})
        soumettre_evaluation_technique(offre_id, technique_data, user)

    financiere_data = data.get("financiere")
    if financiere_data:
        peut_fin, message = _financial_gate(evaluation.offre)
        if not peut_fin:
            raise ValidationError({"detail": message})
        for champ in ["montant_lu", "corrections_arithmetiques", "rabais_accordes"]:
            val = financiere_data.get(champ)
            if val is not None:
                financiere_data[champ] = Decimal(str(val))
        soumettre_evaluation_financiere(offre_id, financiere_data, user)

    conclusion_data = data.get("conclusion")
    if conclusion_data:
        conclusion, created = EvaluationConclusion.objects.get_or_create(
            evaluation=evaluation,
        )
        old_reco = conclusion.recommandation
        conclusion.recommandation = conclusion_data.get("recommandation") or conclusion.recommandation
        conclusion.justification = conclusion_data.get("justification", conclusion.justification)
        if conclusion_data.get("declaration_conflit"):
            conclusion.declaration_conflit = conclusion_data["declaration_conflit"]

        password = (conclusion_data.get("password") or "").strip()
        if password:
            from apps.evaluation_offre.services.validation_access_service import (
                verify_evaluator_password,
            )
            try:
                verify_evaluator_password(
                    user,
                    password,
                    evaluation.offre.seance_id,
                )
            except ValidationError as exc:
                detail = exc.detail
                if isinstance(detail, dict):
                    msg = detail.get("password") or detail.get("detail") or "Mot de passe incorrect."
                else:
                    msg = str(detail)
                raise ValidationError({"detail": msg}) from exc
            if not conclusion.recommandation:
                raise ValidationError({"detail": "La recommandation est obligatoire pour signer."})
            if not conclusion.declaration_conflit:
                raise ValidationError({"detail": "La déclaration de conflit d'intérêt est obligatoire."})
            if len((conclusion.justification or "").strip()) < 10:
                raise ValidationError({
                    "detail": "La justification doit contenir au moins 10 caractères."
                })
            conclusion.signe_le = timezone.now()

        conclusion.save()
        action = "CREATE" if created else "UPDATE"
        _log_audit(
            user,
            "EvaluationConclusion",
            conclusion.pk,
            action,
            champ="recommandation",
            old_val=old_reco,
            new_val=conclusion.recommandation,
        )

    _update_evaluation_statut(evaluation)
    evaluation = _get_evaluation_or_403(offre_id, user)
    _maybe_finalize_seance(evaluation.offre.seance_id)
    return get_evaluation_detail(offre_id, user)


@transaction.atomic
def assigner_evaluateurs_seance(
    seance_id: int,
    user: object,
    evaluateur_ids: list | None = None,
    commission_members: list | None = None,
    date_evaluation: object | None = None,
    heure_evaluation: object | None = None,
    offres_metadata: list | None = None,
) -> list:
    seance = SeanceOuverture.objects.filter(pk=seance_id, statut="VALIDEE").first()
    if not seance:
        raise ValidationError({"detail": "DAO introuvable ou non validé."})

    offres = list(OffreOuverture.objects.filter(seance=seance).order_by("ordre_passage"))
    if not offres:
        raise ValidationError({"detail": "Ce DAO ne contient aucune offre."})

    offres_metadata = offres_metadata or []
    if offres_metadata:
        meta_by_id = {int(item["offre_id"]): item for item in offres_metadata}
        for offre in offres:
            meta = meta_by_id.get(offre.id)
            if not meta:
                continue
            if meta.get("lot_numero") is not None:
                offre.lot_numero = str(meta.get("lot_numero") or "").strip()
            if meta.get("nif_stat") is not None:
                offre.nif_stat = str(meta.get("nif_stat") or "").strip()
            offre.save(update_fields=["lot_numero", "nif_stat"])

    evaluateur_ids = evaluateur_ids or []
    commission_members = commission_members or []
    if bool(evaluateur_ids) == bool(commission_members):
        raise ValidationError({
            "detail": "Fournir soit evaluateur_ids, soit commission_members."
        })

    EvaluationSeanceAssignation.objects.filter(seance=seance).delete()
    EvaluationOffre.objects.filter(offre__seance=seance).delete()

    created_assignations = []
    notify_pairs = []

    if evaluateur_ids:
        if len(evaluateur_ids) != 3 or len(set(evaluateur_ids)) != 3:
            raise ValidationError({"detail": "Exactement 3 évaluateurs distincts requis."})
        users_by_id = {
            u.id: u for u in User.objects.filter(id__in=evaluateur_ids, is_active=True)
        }
        if len(users_by_id) != 3:
            raise ValidationError({"detail": "Un ou plusieurs évaluateurs sont introuvables."})
        for eid in evaluateur_ids:
            ev = users_by_id[eid]
            _ensure_evaluateur_group(ev)
            assignation = EvaluationSeanceAssignation.objects.create(
                seance=seance,
                evaluateur=ev,
                assigned_by=user,
                date_evaluation=date_evaluation or None,
                heure_evaluation=heure_evaluation or None,
                **_snapshot_from_user(ev),
            )
            dao_password = issue_seance_password(assignation)
            created_assignations.append(assignation)
            notify_pairs.append((assignation, dao_password))
            for offre in offres:
                EvaluationOffre.objects.create(
                    offre=offre,
                    evaluateur=ev,
                    date_evaluation=date_evaluation or None,
                    **_snapshot_from_user(ev),
                )

    if commission_members:
        if len(commission_members) != 3:
            raise ValidationError({"detail": "Exactement 3 évaluateurs requis."})
        seen = set()
        for member in commission_members:
            ev, _login_pw = _get_or_create_evaluateur_from_member(member)
            if ev.pk in seen:
                raise ValidationError({"detail": "Les 3 évaluateurs doivent être différents."})
            seen.add(ev.pk)
            assignation = EvaluationSeanceAssignation.objects.create(
                seance=seance,
                evaluateur=ev,
                assigned_by=user,
                date_evaluation=date_evaluation or None,
                heure_evaluation=heure_evaluation or None,
                **_snapshot_from_member(ev, member),
            )
            dao_password = issue_seance_password(assignation)
            created_assignations.append(assignation)
            notify_pairs.append((assignation, dao_password))
            for offre in offres:
                EvaluationOffre.objects.create(
                    offre=offre,
                    evaluateur=ev,
                    date_evaluation=date_evaluation or None,
                    **_snapshot_from_member(ev, member),
                )

    _notify_evaluateurs_seance_assignment(seance, notify_pairs)
    _log_audit(user, "EvaluationSeanceAssignation", seance.id, "CREATE")
    return created_assignations


# ============================================================
# CLASSEMENT FINAL PAR SÉANCE
# ============================================================

def _evaluation_terminee(evaluation: "EvaluationOffre") -> bool:
    return _compute_progress_status(evaluation) == "TERMINEE"


def get_classement_seance(seance_id: int, user: object) -> dict:
    offres = (
        OffreOuverture.objects
        .filter(seance_id=seance_id)
        .prefetch_related(
            "evaluations__evaluation_technique",
            "evaluations__evaluation_financiere",
            "evaluations__conclusion",
            "evaluations__examen_preliminaire",
        )
        .order_by("ordre_passage", "id")
    )

    if not offres.exists():
        raise ValidationError({"detail": "Séance introuvable."})

    user_assigned = EvaluationOffre.objects.filter(
        evaluateur=user,
        offre__seance_id=seance_id,
    ).exists()
    if not user_assigned:
        raise PermissionDenied({"detail": "Vous n'êtes pas assigné à cette séance."})

    total_evaluations = EvaluationOffre.objects.filter(offre__seance_id=seance_id).count()
    completed = sum(
        1
        for evaluation in EvaluationOffre.objects.filter(offre__seance_id=seance_id)
        if _evaluation_terminee(evaluation)
    )
    all_done = total_evaluations > 0 and completed == total_evaluations

    lignes = []
    for offre in offres:
        evaluations = list(offre.evaluations.all())
        scores_tech = []
        scores_fin = []
        for eval_obj in evaluations:
            tech = getattr(eval_obj, "evaluation_technique", None)
            fin = getattr(eval_obj, "evaluation_financiere", None)
            if tech and tech.score_technique_total is not None:
                scores_tech.append(float(tech.score_technique_total))
            if fin and fin.score_financier is not None:
                scores_fin.append(float(fin.score_financier))

        score_tech = round(sum(scores_tech) / len(scores_tech), 2) if scores_tech else None
        score_fin = round(sum(scores_fin) / len(scores_fin), 2) if scores_fin else None
        score_total = None
        if score_tech is not None and score_fin is not None:
            score_total = round(score_tech * 0.60 + score_fin * 0.40, 2)

        examens_conformes = []
        for eval_obj in evaluations:
            try:
                examens_conformes.append(eval_obj.examen_preliminaire.est_conforme)
            except ExamenPreliminaire.DoesNotExist:
                continue
        qualifie = score_tech is not None and score_tech >= 70

        lignes.append({
            "offre_id": offre.id,
            "nom_soumissionnaire": offre.nom_soumissionnaire,
            "score_technique": score_tech,
            "score_financier": score_fin,
            "score_total": score_total,
            "est_conforme": all(examens_conformes) if examens_conformes else None,
            "qualifie_technique": qualifie,
            "consensus_alerte": _compute_consensus_info(offre)["alerte"],
        })

    lignes_triees = sorted(
        [l for l in lignes if l["score_total"] is not None],
        key=lambda item: item["score_total"],
        reverse=True,
    )
    for index, ligne in enumerate(lignes_triees, start=1):
        ligne["rang"] = index

    sans_score = [l for l in lignes if l["score_total"] is None]
    for ligne in sans_score:
        ligne["rang"] = None

    seance = offres.first().seance
    return {
        "seance_id": seance.id,
        "reference_dossier": seance.reference_dossier,
        "objet_dossier": seance.objet_dossier,
        "classement_disponible": all_done,
        "progression": f"{completed}/{total_evaluations}",
        "lignes": lignes_triees + sans_score,
    }
