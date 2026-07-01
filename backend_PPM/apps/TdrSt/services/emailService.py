from __future__ import annotations

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from apps.TdrSt.models.TdrSt import TdrStDocument, TdrStValidationAction

User = get_user_model()
logger = logging.getLogger(__name__)


def _tdrst_notifications_enabled() -> bool:
    return getattr(settings, "TDRST_NOTIFICATION_EMAILS_ENABLED", True)


def _build_subject(subject: str) -> str:
    prefix = getattr(settings, "TDRST_EMAIL_SUBJECT_PREFIX", "[UCP TDR/ST] ")
    return f"{prefix}{subject}".strip()


def _build_frontend_url(path: str) -> str:
    base_url = getattr(
        settings,
        "FRONTEND_APP_URL",
        getattr(settings, "FRONTEND_URL", "http://localhost:3000"),
    ).rstrip("/")
    return f"{base_url}{path}"


def _build_document_url(document: TdrStDocument) -> str:
    return _build_frontend_url(f"/TdrSt/formulaire?focus={document.id}")


def _build_logo_url() -> str:
    return _build_frontend_url("/ucp-sante-logo-color.png")


def _normalize_recipients(recipients: list[str]) -> list[str]:
    unique: list[str] = []
    seen: set[str] = set()

    for recipient in recipients:
        email = str(recipient or "").strip().lower()
        if not email or email in seen:
            continue
        seen.add(email)
        unique.append(email)

    return unique


def _send_tdrst_email(
    *,
    subject: str,
    recipient_list: list[str],
    html_message: str,
    plain_message: str,
    schedule_after_commit: bool = True,
    fail_silently: bool = True,
) -> int:
    recipients = _normalize_recipients(recipient_list)
    if not recipients or not _tdrst_notifications_enabled():
        return 0

    def runner() -> int:
        try:
            message = EmailMultiAlternatives(
                subject=_build_subject(subject),
                body=plain_message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                to=recipients,
                reply_to=getattr(settings, "TDRST_NOTIFICATION_REPLY_TO", None) or None,
            )
            if html_message:
                message.attach_alternative(html_message, "text/html")
            return message.send(fail_silently=fail_silently)
        except Exception:
            logger.exception(
                "Impossible d'envoyer l'email TDR/ST '%s' vers %s.",
                subject,
                ", ".join(recipients),
            )
            if not fail_silently:
                raise
            return 0

    if schedule_after_commit:
        transaction.on_commit(runner)
        return len(recipients)

    return runner()


def send_document_submitted_email(document: TdrStDocument) -> int:
    """Email envoyé aux vérificateurs techniques quand un document est soumis."""
    subject = f"Nouveau document à vérifier - {document.numero_document}"

    verificateurs = User.objects.filter(
        groups__name="VALIDATEUR_TECHNIQUE",
        is_active=True,
    ).distinct()
    recipient_list = [user.email for user in verificateurs if user.email]
    if not recipient_list:
        return 0

    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "unite": document.unite_technique,
        "demandeur": document.demandeur.get_full_name() or document.demandeur.username,
        "url": _build_document_url(document),
        "logo_url": _build_logo_url(),
    }

    html_message = render_to_string("emails/document_submitted.html", context)
    plain_message = strip_tags(html_message)
    return _send_tdrst_email(
        subject=subject,
        recipient_list=recipient_list,
        html_message=html_message,
        plain_message=plain_message,
    )


def send_tech_decision_email(document: TdrStDocument, decision: str, observations: str) -> int:
    """Email envoyé au demandeur après décision technique."""
    if not document.demandeur.email:
        return 0

    if decision == TdrStValidationAction.Decision.FAVORABLE:
        subject = f"Document validé techniquement - {document.numero_document}"
        template = "emails/tech_favorable.html"
    else:
        subject = f"Document à revoir - {document.numero_document}"
        template = "emails/tech_a_revoir.html"

    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "observations": observations,
        "url": _build_document_url(document),
        "logo_url": _build_logo_url(),
    }

    html_message = render_to_string(template, context)
    plain_message = strip_tags(html_message)
    return _send_tdrst_email(
        subject=subject,
        recipient_list=[document.demandeur.email],
        html_message=html_message,
        plain_message=plain_message,
    )


def send_demande_final_approve_email(document: TdrStDocument) -> int:
    """Email envoyé aux approbateurs finaux après validation technique."""
    subject = f"Document à approuver - {document.numero_document}"

    approbateurs = User.objects.filter(
        groups__name="APPROBATEUR_NATIONAL",
        is_active=True,
    ).distinct()
    recipient_list = [user.email for user in approbateurs if user.email]
    if not recipient_list:
        return 0

    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "unite": document.unite_technique,
        "demandeur": document.demandeur.get_full_name() or document.demandeur.username,
        "url": _build_document_url(document),
        "logo_url": _build_logo_url(),
    }

    html_message = render_to_string("emails/demande_final_approve.html", context)
    plain_message = strip_tags(html_message)
    return _send_tdrst_email(
        subject=subject,
        recipient_list=recipient_list,
        html_message=html_message,
        plain_message=plain_message,
    )


def send_final_decision_email(document: TdrStDocument, decision: str, observations: str) -> int:
    """Email envoyé au demandeur après décision finale."""
    if not document.demandeur.email:
        return 0

    if decision == TdrStValidationAction.Decision.APPROUVE:
        subject = f"Document approuvé - {document.numero_document}"
        template = "emails/final_approve.html"
    else:
        subject = f"Document rejeté - {document.numero_document}"
        template = "emails/final_reject.html"

    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "observations": observations,
        "url": _build_document_url(document),
        "logo_url": _build_logo_url(),
    }

    html_message = render_to_string(template, context)
    plain_message = strip_tags(html_message)
    return _send_tdrst_email(
        subject=subject,
        recipient_list=[document.demandeur.email],
        html_message=html_message,
        plain_message=plain_message,
    )


def send_document_suspended_email(document: TdrStDocument, observations: str) -> int:
    """Email envoyé au demandeur quand un document est suspendu."""
    if not document.demandeur.email:
        return 0

    subject = f"Document suspendu - {document.numero_document}"
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "observations": observations,
        "url": _build_document_url(document),
        "logo_url": _build_logo_url(),
    }

    html_message = render_to_string("emails/document_suspended.html", context)
    plain_message = strip_tags(html_message)
    return _send_tdrst_email(
        subject=subject,
        recipient_list=[document.demandeur.email],
        html_message=html_message,
        plain_message=plain_message,
    )
