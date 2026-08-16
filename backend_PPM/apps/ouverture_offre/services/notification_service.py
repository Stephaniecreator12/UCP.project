import logging
from urllib.parse import urlencode
from html import escape

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from apps.ouverture_offre.models import SeanceOuverture, ValidationCompositionMembre
from apps.ouverture_offre.services.validation_access_service import (
    issue_member_validation_password,
    issue_president_validation_password,
)

logger = logging.getLogger(__name__)


def _notifications_enabled():
    return getattr(settings, "OUVERTURE_NOTIFICATION_EMAILS_ENABLED", True)


def _subject(subject):
    prefix = getattr(settings, "OUVERTURE_EMAIL_SUBJECT_PREFIX", "[UCP Ouverture] ")
    return f"{prefix}{subject}".strip()


def _frontend_url(path):
    base_url = getattr(settings, "FRONTEND_APP_URL", "http://localhost:3000").rstrip("/")
    return f"{base_url}{path}"


def _validation_url(seance, role_key, email):
    query = urlencode({"role": role_key, "email": email})
    return _frontend_url(f"/personnel/ouverture_offre/validation/{seance.id}?{query}")


def _composition_validation_url(seance):
    return _frontend_url(f"/personnel/ouverture_offre/validation-membres?seance={seance.id}")


def _user_name(user):
    if not user:
        return "Collaborateur"
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username or "Collaborateur"


def _recipient_email(user):
    if not user or not getattr(user, "is_active", False):
        return ""
    return (getattr(user, "email", "") or "").strip()


def _validation_role(seance, user):
    if seance.president_id == user.id:
        return "Président de séance"
    return "Membre de commission"


def _html_template(name, role, reference, objet, password, action_url):
    ref = escape(reference)
    obj = escape(objet or "-")
    pwd = escape(password)
    nom = escape(name)
    rol = escape(role)
    url = escape(action_url, quote=True)
    return f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f7f9;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 24px 54px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0b7a44 0%,#0ea85b 60%,#14c46c 100%);padding:28px 24px;text-align:center;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#d1fae5;">UCP Validation</p>
              <h1 style="margin:12px 0 0;font-size:22px;line-height:1.2;color:#ffffff;">Validation de séance d'ouverture</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 24px 0;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <span style="display:inline-block;background:#ecfdf5;color:#047857;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:7px 14px;border-radius:999px;">{rol}</span>
              </div>
              <p style="margin:20px 0 18px;font-size:15px;line-height:1.7;color:#334155;">Bonjour <strong>{nom}</strong>, vous êtes invité(e) à valider la séance d'ouverture ci-dessous.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
                <tr>
                  <td style="padding:14px 16px;font-size:12px;font-weight:700;color:#64748b;width:40%;">Référence</td>
                  <td style="padding:14px 16px;font-size:14px;color:#0f172a;">{ref}</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:14px 16px;font-size:12px;font-weight:700;color:#64748b;">Objet</td>
                  <td style="padding:14px 16px;font-size:14px;color:#0f172a;">{obj}</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:14px 16px;font-size:12px;font-weight:700;color:#64748b;">Mot de passe</td>
                  <td style="padding:14px 16px;font-size:14px;color:#0f172a;font-weight:700;letter-spacing:0.04em;">{pwd}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;text-align:center;">
              <a href="{url}" style="display:inline-block;background:linear-gradient(135deg,#0b7a44,#0ea85b);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:999px;font-size:14px;font-weight:700;">Accéder à la validation →</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px 24px;color:#64748b;font-size:12px;line-height:1.6;">Ce mot de passe est valable uniquement pour cette séance.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _send_email(subject, body, recipient, html_body):
    if not recipient or not _notifications_enabled():
        return 0
    message = EmailMultiAlternatives(
        subject=_subject(subject),
        body=body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=[recipient],
        reply_to=getattr(settings, "OUVERTURE_NOTIFICATION_REPLY_TO", None) or None,
    )
    message.attach_alternative(html_body, "text/html")
    result = message.send(fail_silently=False)
    logger.info("Email ouverture → %s : %s", recipient, result)
    return result


def _send_validation_requests(seance: SeanceOuverture, recipient_credentials):
    seance = (
        SeanceOuverture.objects.select_related("secretaire", "president")
        .prefetch_related("membres__utilisateur")
        .get(pk=seance.pk)
    )
    sent_count = 0
    for user, password, role_key in recipient_credentials:
        email = _recipient_email(user)
        if not email:
            continue
        role = _validation_role(seance, user)
        action_url = _validation_url(seance, role_key, email)
        name = _user_name(user)
        subject = "Validation de séance d'ouverture requise"
        body = (
            f"Bonjour {name},\n\n"
            f"Rôle : {role}\n"
            f"Référence : {seance.reference_dossier}\n"
            f"Objet : {seance.objet_dossier or '-'}\n\n"
            f"Mot de passe de validation : {password}\n"
            f"Lien : {action_url}\n\n"
            "Ce mot de passe est valable uniquement pour cette séance.\n"
        )
        html_body = _html_template(
            name, role,
            seance.reference_dossier,
            seance.objet_dossier or "-",
            password, action_url,
        )
        try:
            sent_count += _send_email(subject, body, email, html_body)
        except Exception:
            logger.exception("Échec envoi email vers %s (séance %s)", email, seance.id)
    return sent_count


COMPOSITION_ROLE_SEQUENCE = (
    ValidationCompositionMembre.RoleValidateur.RPM,
    ValidationCompositionMembre.RoleValidateur.GP,
    ValidationCompositionMembre.RoleValidateur.CN,
)


def _pick_roles_to_notify(seance: SeanceOuverture, role: str | None = None):
    validations_by_role = {
        validation.role: validation for validation in seance.validations_composition.all()
    }
    if role:
        validation = validations_by_role.get(role)
        return [
            role
        ] if validation and validation.decision == ValidationCompositionMembre.Decision.EN_ATTENTE else []

    for candidate_role in COMPOSITION_ROLE_SEQUENCE:
        validation = validations_by_role.get(candidate_role)
        if not validation:
            continue
        if validation.decision != ValidationCompositionMembre.Decision.EN_ATTENTE:
            continue
        return [candidate_role]

    return []


def notify_composition_validators_requested(seance: SeanceOuverture, role: str | None = None):
    """Envoie les emails au validateur actif de la composition."""
    from apps.ouverture_offre.services.composition_validation_service import (
        _users_for_role,
    )

    seance = (
        SeanceOuverture.objects.select_related("secretaire")
        .prefetch_related("membres__utilisateur", "validations_composition")
        .get(pk=seance.pk)
    )
    sent_count = 0
    role_labels = {
        ValidationCompositionMembre.RoleValidateur.CN: "Coordonnateur National",
        ValidationCompositionMembre.RoleValidateur.GP: "Gestionnaire de Programme",
        ValidationCompositionMembre.RoleValidateur.RPM: "Responsable Passation de Marché",
    }

    for validation_role in _pick_roles_to_notify(seance, role=role):
        users = _users_for_role(validation_role)
        role_label = role_labels.get(validation_role, validation_role)
        for user in users:
            email = _recipient_email(user)
            if not email:
                continue
            name = _user_name(user)
            action_url = _composition_validation_url(seance)
            subject = "Validation de la composition de commission requise"
            body = (
                f"Bonjour {name},\n\n"
                f"Rôle : {role_label}\n"
                f"Référence : {seance.reference_dossier}\n"
                f"Objet : {seance.objet_dossier or '-'}\n\n"
                f"Veuillez valider la composition des membres de la commission d'ouverture.\n"
                f"Lien : {action_url}\n"
            )
            html_body = _html_template(
                name,
                role_label,
                seance.reference_dossier,
                seance.objet_dossier or "-",
                "—",
                action_url,
            )
            html_body = html_body.replace(
                "Validation de séance d'ouverture",
                "Validation composition membres",
            ).replace(
                "valider la séance d'ouverture ci-dessous",
                "valider la composition des membres de commission ci-dessous",
            )
            try:
                sent_count += _send_email(subject, body, email, html_body)
            except Exception:
                logger.exception(
                    "Échec envoi email composition → %s (séance %s)",
                    email,
                    seance.id,
                )
    return sent_count


def notify_members_validation_requested(seance: SeanceOuverture):
    seance = (
        SeanceOuverture.objects.select_related("secretaire", "president")
        .prefetch_related("membres__utilisateur")
        .get(pk=seance.pk)
    )
    credentials = []
    for membre in seance.membres.select_related("utilisateur").filter(est_present=True):
        credentials.append(
            (membre.utilisateur, issue_member_validation_password(membre), "membre")
        )
    return _send_validation_requests(seance, credentials)


def notify_president_validation_requested(seance: SeanceOuverture):
    seance = SeanceOuverture.objects.select_related("president").get(pk=seance.pk)
    if not seance.president:
        return 0
    password = issue_president_validation_password(seance)
    return _send_validation_requests(seance, [(seance.president, password, "president")])
