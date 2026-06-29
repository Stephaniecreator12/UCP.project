from __future__ import annotations

<<<<<<< HEAD
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth import get_user_model
=======
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils.html import strip_tags
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d

from apps.TdrSt.models.TdrSt import TdrStDocument, TdrStValidationAction
from apps.users.models import UserProfile

User = get_user_model()
<<<<<<< HEAD


def send_document_submitted_email(document: TdrStDocument) -> None:
    """Email envoyé aux VERIFICATEURS_TECHNIQUES quand un document est soumis."""
    subject = f"[TdR/ST] Nouveau document à vérifier - {document.numero_document}"
    
    verificateurs = User.objects.filter(
        profile__role=UserProfile.Role.VERIFICATEUR_TECHNIQUE,
        is_active=True
    )
    
    if not verificateurs.exists():
        print(f"Aucun vérificateur technique trouvé pour le document {document.numero_document}")
        return
    
=======
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
        profile__role=UserProfile.Role.VERIFICATEUR_TECHNIQUE,
        is_active=True,
    )
    recipient_list = [user.email for user in verificateurs if user.email]
    if not recipient_list:
        return 0

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "unite": document.unite_technique,
<<<<<<< HEAD
        "initiateur": document.initiateur.get_full_name() or document.initiateur.username,
        "url": f"{settings.FRONTEND_URL}/TdrSt/verification/{document.id}",
        "logo_url": f"{settings.FRONTEND_URL}/ucp-sante-logo-color.png",
    }
    
    html_message = render_to_string("emails/document_submitted.html", context)
    plain_message = strip_tags(html_message)
    
    recipient_list = [v.email for v in verificateurs if v.email]
    print(f"Envoi email à : {recipient_list}")
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False,
    )


def send_tech_decision_email(document: TdrStDocument, decision: str, observations: str) -> None:
    """Email envoyé à l'initiateur après décision technique."""
    if decision == TdrStValidationAction.Decision.FAVORABLE:
        subject = f"[TdR/ST] Document validé techniquement - {document.numero_document}"
        template = "emails/tech_favorable.html"
    else:
        subject = f"[TdR/ST] Document à revoir - {document.numero_document}"
        template = "emails/tech_a_revoir.html"
    
=======
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

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "observations": observations,
<<<<<<< HEAD
        "url": f"{settings.FRONTEND_URL}/TdrSt/formulaire?id={document.id}",
        "logo_url": f"{settings.FRONTEND_URL}/ucp-sante-logo-color.png",
    }
    
    html_message = render_to_string(template, context)
    plain_message = strip_tags(html_message)
    
    if document.initiateur.email:
        print(f"Envoi email à l'initiateur : {document.initiateur.email}")
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[document.initiateur.email],
            html_message=html_message,
            fail_silently=False,
        )


def send_demande_final_approve_email(document: TdrStDocument) -> None:
    """Email envoyé aux APPROBATEURS_FINAUX quand un document est validé techniquement."""
    subject = f"[TdR/ST] Document à approuver - {document.numero_document}"
    
    approbateurs = User.objects.filter(
        profile__role=UserProfile.Role.APPROBATEUR_FINAL,
        is_active=True
    )
    
    if not approbateurs.exists():
        print(f"Aucun approbateur final trouvé pour le document {document.numero_document}")
        return
    
=======
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
        profile__role=UserProfile.Role.APPROBATEUR_FINAL,
        is_active=True,
    )
    recipient_list = [user.email for user in approbateurs if user.email]
    if not recipient_list:
        return 0

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "unite": document.unite_technique,
<<<<<<< HEAD
        "initiateur": document.initiateur.get_full_name() or document.initiateur.username,
        "url": f"{settings.FRONTEND_URL}/TdrSt/approbation/{document.id}",
        "logo_url": f"{settings.FRONTEND_URL}/ucp-sante-logo-color.png",
    }
    
    html_message = render_to_string("emails/demande_final_approve.html", context)
    plain_message = strip_tags(html_message)
    
    recipient_list = [a.email for a in approbateurs if a.email]
    print(f"Envoi email aux approbateurs finaux : {recipient_list}")
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False,
    )


def send_final_decision_email(document: TdrStDocument, decision: str, observations: str) -> None:
    """Email envoyé à l'initiateur après décision finale."""
    if decision == TdrStValidationAction.Decision.APPROUVE:
        subject = f"[TdR/ST] Document approuvé - {document.numero_document}"
        template = "emails/final_approve.html"
    else:
        subject = f"[TdR/ST] Document rejeté - {document.numero_document}"
        template = "emails/final_reject.html"
    
=======
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

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "observations": observations,
<<<<<<< HEAD
        "url": f"{settings.FRONTEND_URL}/TdrSt/formulaire?id={document.id}",
        "logo_url": f"{settings.FRONTEND_URL}/ucp-sante-logo-color.png",
    }
    
    html_message = render_to_string(template, context)
    plain_message = strip_tags(html_message)
    
    if document.initiateur.email:
        print(f"Envoi email à l'initiateur : {document.initiateur.email}")
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[document.initiateur.email],
            html_message=html_message,
            fail_silently=False,
        )


def send_ano_request_email(document: TdrStDocument) -> None:
    """Email envoyé aux BAILLEURS quand un document nécessite un avis ANO."""
    subject = f"[TdR/ST] Avis ANO requis - {document.numero_document}"
    
    bailleurs = User.objects.filter(
        profile__role=UserProfile.Role.BAILLEUR,
        is_active=True
    )
    
    if not bailleurs.exists():
        print(f"Aucun bailleur trouvé pour le document {document.numero_document}")
        return
    
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "montant": f"{document.montant_estime_usd:,.2f} USD",
        "seuil": f"{document.seuil_passation:,.2f} USD" if document.seuil_passation else "Non défini",
        "unite": document.unite_technique,
        "initiateur": document.initiateur.get_full_name() or document.initiateur.username,
        "url": f"{settings.FRONTEND_URL}/TdrSt/ano/{document.id}",
        "logo_url": f"{settings.FRONTEND_URL}/ucp-sante-logo-color.png",
    }
    
    html_message = render_to_string("emails/ano_request.html", context)
    plain_message = strip_tags(html_message)
    
    recipient_list = [b.email for b in bailleurs if b.email]
    print(f"Envoi email aux bailleurs : {recipient_list}")
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False,
    )


def send_ano_decision_email(document: TdrStDocument, decision: str, observations: str) -> None:
    """Email envoyé à l'initiateur après décision ANO."""
    if decision == TdrStValidationAction.Decision.ANO_ACCORDE:
        subject = f"[TdR/ST] Avis ANO accordé - {document.numero_document}"
        template = "emails/ano_accorde.html"
    else:
        subject = f"[TdR/ST] Avis ANO refusé - {document.numero_document}"
        template = "emails/ano_refuse.html"
    
=======
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
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "observations": observations,
<<<<<<< HEAD
        "url": f"{settings.FRONTEND_URL}/TdrSt/formulaire?id={document.id}",
        "logo_url": f"{settings.FRONTEND_URL}/ucp-sante-logo-color.png",
    }
    
    html_message = render_to_string(template, context)
    plain_message = strip_tags(html_message)
    
    if document.initiateur.email:
        print(f"Envoi email à l'initiateur : {document.initiateur.email}")
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[document.initiateur.email],
            html_message=html_message,
            fail_silently=False,
        )


def send_document_suspended_email(document: TdrStDocument, observations: str) -> None:
    """Email envoyé à l'initiateur quand un document est suspendu."""
    subject = f"[TdR/ST] Document suspendu - {document.numero_document}"
    
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "observations": observations,
        "url": f"{settings.FRONTEND_URL}/TdrSt/formulaire?id={document.id}",
        "logo_url": f"{settings.FRONTEND_URL}/ucp-sante-logo-color.png",
    }
    
    html_message = render_to_string("emails/document_suspended.html", context)
    plain_message = strip_tags(html_message)
    
    if document.initiateur.email:
        print(f"Envoi email à l'initiateur : {document.initiateur.email}")
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[document.initiateur.email],
            html_message=html_message,
            fail_silently=False,
        )
=======
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
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
