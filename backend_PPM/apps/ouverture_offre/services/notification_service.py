import logging
from html import escape
from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction

from apps.ouverture_offre.models import SeanceOuverture
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
    query = urlencode({
        "role": role_key,
        "email": email,
    })
    return _frontend_url(f"/ouverture_offre/validation/{seance.id}?{query}")


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


def _html_template(title, content_html, action_url):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 10px 8px; background-color: #f1f5f9; color: #334155; font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;">
        <div style="max-width: 620px; margin: 0 auto; border: 1px solid #dbe3ea; border-radius: 12px; background-color: #ffffff; overflow: hidden;">
            <div style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0;">
                <div style="display: inline-block; border-radius: 999px; background-color: #ecfdf5; color: #047857; padding: 4px 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">
                    Ouverture des offres
                </div>
                <h1 style="margin: 7px 0 0; color: #0f172a; font-size: 18px; line-height: 1.2; font-weight: 800;">
                    {escape(title)}
                </h1>
            </div>
            <div style="padding: 16px 18px 18px; color: #475569; font-size: 13px; line-height: 1.5;">
                {content_html}
                <div style="margin-top: 16px;">
                    <a href="{escape(action_url, quote=True)}" style="display: inline-block; border-radius: 9px; background-color: #0f766e; color: #ffffff; padding: 10px 16px; text-decoration: none; font-size: 13px; font-weight: 800;">
                        Valider la séance
                    </a>
                </div>
            </div>
            <div style="border-top: 1px solid #e2e8f0; background-color: #f8fafc; padding: 10px 18px; color: #64748b; font-size: 11px; line-height: 1.4;">
                Ce message est généré automatiquement par le système d'information de l'UCP.
            </div>
        </div>
    </body>
    </html>
    """


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
    return message.send(fail_silently=True)


def _send_validation_requests(seance: SeanceOuverture, recipient_credentials):
    seance = (
        SeanceOuverture.objects.select_related("secretaire", "president")
        .prefetch_related("membres__utilisateur")
        .get(pk=seance.pk)
    )

    def runner():
        sent_count = 0
        for user, password, role_key in recipient_credentials:
            email = _recipient_email(user)
            if not email:
                continue

            role = _validation_role(seance, user)
            action_url = _validation_url(seance, role_key, email)
            title = "Validation de séance d'ouverture requise"
            body = (
                f"Bonjour {_user_name(user)},\n\n"
                f"Vous êtes sollicité comme {role} pour valider la séance d'ouverture "
                f"{seance.reference_dossier}.\n"
                f"Objet : {seance.objet_dossier or '-'}\n\n"
                f"Mot de passe de validation : {password}\n"
                f"Valider la seance : {action_url}\n\n"
                "Ce mot de passe est valable uniquement pour ce DAO et sera desactive apres votre decision.\n"
            )
            html_body = _html_template(
                title,
                f"""
                <p>Bonjour <strong>{escape(_user_name(user))}</strong>,</p>
                <p>Vous êtes sollicité comme <strong>{escape(role)}</strong> pour valider la séance d'ouverture.</p>
                <div style="margin: 12px 0; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc; padding: 12px;">
                    <div style="font-size: 12px; color: #64748b; font-weight: 700;">Référence</div>
                    <div style="font-size: 14px; color: #0f172a; font-weight: 800;">{escape(seance.reference_dossier)}</div>
                    <div style="margin-top: 8px; font-size: 12px; color: #64748b; font-weight: 700;">Objet</div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 700;">{escape(seance.objet_dossier or "-")}</div>
                </div>
                <p>Utilisez le mot de passe ci-dessous pour accéder uniquement à la validation de ce DAO.</p>
                <div style="margin: 12px 0; border: 1px solid #bbf7d0; border-radius: 10px; background-color: #f0fdf4; padding: 12px; color: #14532d;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">Mot de passe de validation</div>
                    <div style="margin-top: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 18px; font-weight: 900; letter-spacing: 0.08em;">{escape(password)}</div>
                </div>
                <p>Ce mot de passe est valable uniquement pour cette séance. Après validation, rejet ou report, il sera désactivé.</p>
                """,
                action_url,
            )

            try:
                sent_count += _send_email(title, body, email, html_body)
            except Exception:
                logger.exception(
                    "Impossible d'envoyer l'email d'ouverture vers %s pour la seance %s.",
                    email,
                    seance.id,
                )
        return sent_count

    transaction.on_commit(runner)
    return len(recipient_credentials)


def notify_members_validation_requested(seance: SeanceOuverture):
    seance = (
        SeanceOuverture.objects.select_related("secretaire", "president")
        .prefetch_related("membres__utilisateur")
        .get(pk=seance.pk)
    )
    credentials = []
    for membre in seance.membres.select_related("utilisateur").filter(est_present=True):
        credentials.append((membre.utilisateur, issue_member_validation_password(membre), "membre"))
    return _send_validation_requests(seance, credentials)


def notify_president_validation_requested(seance: SeanceOuverture):
    seance = SeanceOuverture.objects.select_related("president").get(pk=seance.pk)
    if not seance.president:
        return 0
    password = issue_president_validation_password(seance)
    return _send_validation_requests(seance, [(seance.president, password, "president")])
