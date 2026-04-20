from __future__ import annotations

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth import get_user_model

from apps.TdrSt.models.TdrSt import TdrStDocument, TdrStValidationAction
from apps.users.models import UserProfile

User = get_user_model()


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
    
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "unite": document.unite_technique,
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
    
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "observations": observations,
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
    
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "unite": document.unite_technique,
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
    
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "observations": observations,
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
    
    context = {
        "document": document,
        "numero": document.numero_document,
        "intitule": document.intitule,
        "observations": observations,
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
