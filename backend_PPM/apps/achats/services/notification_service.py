import logging
from html import escape

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.db import transaction

from apps.achats.models import DemandeAchat, ValidationDemande

logger = logging.getLogger(__name__)

User = get_user_model()

from apps.authorization.constants import (
    AGENT_ACHAT, FINANCE, RAF, VALIDATEUR_BUDGETAIRE,
    VALIDATEUR_HIERARCHIQUE, VALIDATEUR_TECHNIQUE,
    VALIDATEUR_PROGRAMMATIQUE, APPROBATEUR_NATIONAL,
)

AGENT_ACHAT_GROUP = AGENT_ACHAT
FINANCE_GROUPS = [FINANCE, RAF, VALIDATEUR_BUDGETAIRE]

STEP_TO_GROUP = {
    DemandeAchat.ETAPE_HIERARCHIQUE: VALIDATEUR_HIERARCHIQUE,
    DemandeAchat.ETAPE_TECHNIQUE: VALIDATEUR_TECHNIQUE,
    DemandeAchat.ETAPE_PROGRAMMATIQUE: VALIDATEUR_PROGRAMMATIQUE,
    DemandeAchat.ETAPE_APPROBATION_FINALE: APPROBATEUR_NATIONAL,
}

STEP_LABELS = {
    DemandeAchat.ETAPE_HIERARCHIQUE: "Validation hiérarchique",
    DemandeAchat.ETAPE_TECHNIQUE: "Validation technique",
    DemandeAchat.ETAPE_BUDGETAIRE: "Validation budgétaire",
    DemandeAchat.ETAPE_PROGRAMMATIQUE: "Validation programmatique",
    DemandeAchat.ETAPE_APPROBATION_FINALE: "Approbation finale",
    DemandeAchat.ETAPE_TERMINEE: "Dossier validé",
}

DECISION_LABELS = {
    ValidationDemande.DECISION_FAVORABLE: "Favorable",
    ValidationDemande.DECISION_DEFAVORABLE: "Défavorable",
    ValidationDemande.DECISION_A_COMPLETER: "À compléter",
    ValidationDemande.DECISION_APPROUVEE: "Approuvée",
    ValidationDemande.DECISION_REJETEE: "Rejetée",
    ValidationDemande.DECISION_A_REVOIR: "À revoir",
}

EXPEDITION_LABELS = {
    DemandeAchat.ETAT_EXPEDITION_TRANSIT: "En transit vers le site",
    DemandeAchat.ETAT_EXPEDITION_ARRIVE: "Arrivée sur site",
    DemandeAchat.ETAT_EXPEDITION_PARTIEL: "Arrivée partiellement",
    DemandeAchat.ETAT_EXPEDITION_RETARD: "Signalée en retard",
}

EMAIL_VALUE_STYLES = {
    "default": "vertical-align: top; color: #0f172a; font-size: 12.5px; font-weight: 600; line-height: 1.35;",
    "accent": "vertical-align: top; color: #047857; font-size: 12.5px; font-weight: 700; line-height: 1.35;",
    "success": "vertical-align: top; color: #047857; font-size: 12.5px; font-weight: 700; line-height: 1.35;",
    "warning": "vertical-align: top; color: #b45309; font-size: 12.5px; font-weight: 700; line-height: 1.35;",
    "danger": "vertical-align: top; color: #b91c1c; font-size: 12.5px; font-weight: 700; line-height: 1.35;",
    "info": "vertical-align: top; color: #0369a1; font-size: 12.5px; font-weight: 700; line-height: 1.35;",
}


def is_email_notifications_enabled():
    return getattr(settings, "ACHATS_NOTIFICATION_EMAILS_ENABLED", True)


def _build_subject(subject):
    prefix = getattr(settings, "ACHATS_EMAIL_SUBJECT_PREFIX", "[UCP] ")
    return f"{prefix}{subject}".strip()


def _build_frontend_url(path):
    base_url = getattr(settings, "FRONTEND_APP_URL", "http://localhost:3000").rstrip("/")
    return f"{base_url}{path}"


def _get_user_display_name(user):
    if not user:
        return "Collaborateur"
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username or "Collaborateur"


def _normalize_recipients(recipients):
    unique = []
    seen = set()
    for recipient in recipients:
        if not recipient:
            continue
        email = str(recipient).strip().lower()
        if not email or email in seen:
            continue
        seen.add(email)
        unique.append(email)
    return unique


def _emails_for_user(user):
    if not user or not getattr(user, "is_active", False):
        return []
    email = (getattr(user, "email", "") or "").strip()
    return [email] if email else []


def _emails_for_group(group_name):
    return list(
        User.objects.filter(is_active=True, groups__name=group_name)
        .exclude(email="")
        .values_list("email", flat=True)
        .distinct()
    )


def _emails_for_groups(group_names):
    recipients = []
    for group_name in group_names:
        recipients.extend(_emails_for_group(group_name))
    return recipients


def _emails_for_validation_step(step):
    if step == DemandeAchat.ETAPE_BUDGETAIRE:
        return _emails_for_groups(FINANCE_GROUPS)

    group_name = STEP_TO_GROUP.get(step)
    return _emails_for_group(group_name) if group_name else []


def _format_email_value(value, fallback="-"):
    if value is None:
        return fallback
    text = str(value).strip()
    return text or fallback


def _humanize_identifier(value, fallback="-"):
    text = _format_email_value(value, fallback)
    return text if text == fallback else text.replace("_", " ").title()


def _render_email_details(rows):
    rendered_rows = []
    for index, (label, value, tone) in enumerate(rows):
        separator_style = "" if index == 0 else "border-top: 1px solid #e2e8f0;"
        rendered_rows.append(
            f"""
            <tr>
                <td style="padding: 8px 0; width: 31%; vertical-align: top; color: #64748b; font-size: 11.5px; font-weight: 600; line-height: 1.3; {separator_style}">
                    {escape(str(label))}
                </td>
                <td style="padding: 8px 0; {EMAIL_VALUE_STYLES.get(tone, EMAIL_VALUE_STYLES['default'])} {separator_style}">
                    {escape(_format_email_value(value))}
                </td>
            </tr>
            """
        )

    return f"""
    <div style="margin: 12px 0 14px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc; padding: 0 12px;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            {''.join(rendered_rows)}
        </table>
    </div>
    """


def get_html_template(title, content_html, action_url=None, action_text="Consulter le dossier"):
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
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 8px 6px; background-color: #f1f5f9; color: #334155; font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #dbe3ea; border-radius: 10px; background-color: #ffffff; overflow: hidden;">
            <div style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
                <div style="display: inline-block; border-radius: 999px; background-color: #ecfdf5; color: #047857; padding: 3px 7px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
                    UCP Achats
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
                Ce message est généré automatiquement par le système d'information de l'UCP.
                Merci de ne pas y répondre directement.
            </div>
        </div>
    </body>
    </html>
    """


def _dispatch_email(subject, body, recipients, fail_silently, html_body=None):
    if not recipients or not is_email_notifications_enabled():
        return 0

    message = EmailMultiAlternatives(
        subject=_build_subject(subject),
        body=body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=recipients,
        reply_to=getattr(settings, "ACHATS_NOTIFICATION_REPLY_TO", None) or None,
    )
    if html_body:
        message.attach_alternative(html_body, "text/html")

    return message.send(fail_silently=fail_silently)


def send_notification_email(
    subject,
    body,
    recipients,
    *,
    html_body=None,
    schedule_after_commit=True,
    fail_silently=True,
):
    normalized_recipients = _normalize_recipients(recipients)
    if not normalized_recipients or not is_email_notifications_enabled():
        return 0

    def runner():
        try:
            return _dispatch_email(
                subject,
                body,
                normalized_recipients,
                fail_silently=fail_silently,
                html_body=html_body,
            )
        except Exception:
            logger.exception(
                "Impossible d'envoyer l'email de notification '%s' vers %s.",
                subject,
                ", ".join(normalized_recipients),
            )
            if not fail_silently:
                raise
            return 0

    if schedule_after_commit:
        transaction.on_commit(runner)
        return len(normalized_recipients)

    return runner()


def notify_demande_submitted(demande):
    group_name = STEP_TO_GROUP.get(demande.etape_validation_actuelle)
    if not group_name:
        return 0

    recipients = _emails_for_group(group_name)
    step_label = STEP_LABELS.get(demande.etape_validation_actuelle, "validation")
    demandeur_name = _get_user_display_name(demande.demandeur)
    action_url = _build_frontend_url("/validation")

    body = (
        f"Bonjour,\n\n"
        f"La demande d'achat {demande.numero_demande} a été soumise par {demandeur_name}.\n"
        f"Objet : {demande.objet}\n"
        f"Étape en cours : {step_label}\n\n"
        f"Vous pouvez la traiter ici : {action_url}\n"
    )

    html_content = f"""
        <p style="margin: 0 0 8px;">Bonjour,</p>
        <p style="margin: 0 0 10px;">Une nouvelle demande d'achat attend votre validation dans le système.</p>
        {_render_email_details([
            ("N° Demande", demande.numero_demande, "accent"),
            ("Demandeur", demandeur_name, "default"),
            ("Objet", demande.objet, "default"),
            ("Action requise", step_label, "warning"),
        ])}
    """

    return send_notification_email(
        f"Action Requise : Nouvelle demande à valider ({demande.numero_demande})",
        body,
        recipients,
        html_body=get_html_template(
            "Nouvelle Demande à valider",
            html_content,
            action_url,
            "Accéder à l'espace Validation",
        ),
    )


def notify_validation_recorded(demande, validation):
    decision_label = DECISION_LABELS.get(validation.decision, validation.decision).upper()
    step_label = STEP_LABELS.get(validation.etape, validation.etape)
    validateur_name = _get_user_display_name(validation.validateur)

    if validation.decision in [
        ValidationDemande.DECISION_DEFAVORABLE,
        ValidationDemande.DECISION_REJETEE,
        ValidationDemande.DECISION_A_COMPLETER,
        ValidationDemande.DECISION_A_REVOIR,
    ]:
        recipients = _emails_for_user(demande.demandeur)
        action_url = _build_frontend_url("/demande-achat/dashboard")

        body = (
            f"Bonjour,\n\n"
            f"Une décision {decision_label} a été enregistrée pour {demande.numero_demande} "
            f"par {validateur_name} ({step_label})."
        )

        details = [
            ("N° Demande", demande.numero_demande, "accent"),
            ("Avis émis", decision_label, "danger"),
            ("Étape", f"{step_label} par {validateur_name}", "default"),
        ]
        if validation.commentaire:
            details.append(("Motif / Commentaire", validation.commentaire, "warning"))

        html_content = f"""
            <p style="margin: 0 0 8px;">Bonjour,</p>
            <p style="margin: 0 0 10px;">Votre demande d'achat a reçu un avis nécessitant votre attention.</p>
            {_render_email_details(details)}
        """
        return send_notification_email(
            f"Mise a jour de votre demande : {demande.numero_demande} ({decision_label})",
            body,
            recipients,
            html_body=get_html_template(
                "Avis défavorable / Retour demandé",
                html_content,
                action_url,
                "Voir mon tableau de bord",
            ),
        )

    if demande.statut == DemandeAchat.STATUT_VALIDEE_BUDGETAIRE:
        return notify_budget_validated(demande)

    recipients = _emails_for_validation_step(demande.etape_validation_actuelle)
    next_step_label = STEP_LABELS.get(demande.etape_validation_actuelle, "validation")
    action_url = _build_frontend_url("/validation")

    body = (
        f"Bonjour,\n\n"
        f"La demande {demande.numero_demande} est arrivée à votre niveau de validation "
        f"({next_step_label})."
    )
    html_content = f"""
        <p style="margin: 0 0 8px;">Bonjour,</p>
        <p style="margin: 0 0 8px;">
            L'étape de <strong>{escape(step_label)}</strong> a enregistré un avis
            <strong> {escape(decision_label)}</strong> via {escape(validateur_name)}.
        </p>
        <p style="margin: 0 0 10px;">La demande est maintenant dans votre file d'attente.</p>
        {_render_email_details([
            ("N° Demande", demande.numero_demande, "accent"),
            ("Dernier avis", decision_label, "success"),
            ("Votre action", next_step_label, "warning"),
        ])}
    """
    return send_notification_email(
        f"À votre tour de valider : {demande.numero_demande}",
        body,
        recipients,
        html_body=get_html_template(
            "Validation transférée",
            html_content,
            action_url,
            "Accéder à la validation",
        ),
    )


def notify_budget_validated(demande):
    recipients = _emails_for_user(demande.demandeur) + _emails_for_group(AGENT_ACHAT_GROUP)
    action_url = _build_frontend_url("/passation")

    body = (
        f"Bonjour,\n\n"
        f"La demande {demande.numero_demande} a terminé le circuit des 5 validations et est transmise à la passation."
    )
    html_content = f"""
        <p style="margin: 0 0 8px;">Bonjour,</p>
        <p style="margin: 0 0 10px;">Le dossier a terminé le circuit complet de validation, y compris le budget et l'engagement.</p>
        {_render_email_details([
            ("N° Demande", demande.numero_demande, "accent"),
            ("Ligne budgétaire", demande.ligne_budgetaire or "-", "default"),
            ("Engagement", demande.numero_engagement_budgetaire or "-", "info"),
            ("Statut actuel", "Prêt pour passation", "success"),
        ])}
        <p style="margin: 0;">Le service des achats peut maintenant enregistrer le bon de commande.</p>
    """
    return send_notification_email(
        f"Dossier transmis a la passation : {demande.numero_demande}",
        body,
        recipients,
        html_body=get_html_template(
            "Dossier validé et transmis à la Passation",
            html_content,
            action_url,
            "Ouvrir l'espace Passation",
        ),
    )


def notify_order_issued(demande):
    sent = 0
    sent += notify_order_issued_to_requester(demande)
    sent += notify_order_issued_to_supplier(demande)
    return sent


def notify_order_issued_to_requester(demande):
    recipients = _emails_for_user(demande.demandeur)
    action_url = _build_frontend_url("/demande-achat/dashboard")

    body = f"Bonjour,\n\nLe bon de commande de la demande {demande.numero_demande} a été enregistré."
    html_content = f"""
        <p style="margin: 0 0 8px;">Bonjour,</p>
        <p style="margin: 0 0 10px;">Le service des achats vient d'enregistrer le bon de commande de votre demande.</p>
        {_render_email_details([
            ("N° Demande", demande.numero_demande, "accent"),
            ("Fournisseur", demande.fournisseur_retenu or "Non précisé", "default"),
            ("Bon de commande", demande.numero_bon_commande or "Généré", "info"),
            ("Montant total", f"{demande.montant_commande} Ar", "success"),
            ("Délai de livraison", f"{demande.delai_livraison_contractuel} jours", "warning"),
        ])}
        <p style="margin: 0;">Le suivi passe maintenant côté Marché pour l'expédition et la réception.</p>
    """
    return send_notification_email(
        f"Bon de commande emis : {demande.numero_demande}",
        body,
        recipients,
        html_body=get_html_template(
            "Commande engagée",
            html_content,
            action_url,
            "Voir l'avancement",
        ),
    )


def notify_order_issued_to_supplier(demande):
    supplier_email = (getattr(demande, "email_fournisseur", "") or "").strip()
    if not supplier_email:
        return 0

    recipients = [supplier_email]
    body = (
        f"Bonjour,\n\n"
        f"L'UCP vous informe que le bon de commande {demande.numero_bon_commande or '-'} "
        f"lié à la demande {demande.numero_demande} a été enregistré."
    )
    html_content = f"""
        <p style="margin: 0 0 8px;">Bonjour,</p>
        <p style="margin: 0 0 10px;">
            L'UCP confirme l'enregistrement du bon de commande relatif à la demande
            <strong>{escape(demande.numero_demande)}</strong>.
        </p>
        {_render_email_details([
            ("N° Demande", demande.numero_demande, "accent"),
            ("Fournisseur", demande.fournisseur_retenu or "Non précisé", "default"),
            ("Bon de commande", demande.numero_bon_commande or "Généré", "info"),
            ("Date bon", demande.date_bon_commande, "default"),
            ("Montant total", f"{demande.montant_commande} Ar", "success"),
            ("Délai de livraison", f"{demande.delai_livraison_contractuel} jours", "warning"),
            ("Conditions", demande.conditions_livraison or "-", "default"),
        ])}
        
        <div style="margin: 14px 0;">
            <p style="margin: 0 0 6px; font-weight: 700; font-size: 13px; color: #0f172a;">Détail des articles :</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead style="background-color: #f1f5f9;">
                    <tr>
                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0; color: #64748b;">Article / Service</th>
                        <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0; color: #64748b;">Quantité</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join([
                        f'<tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">{escape(l.designation or l.description_service)}</td>'
                        f'<td style="padding: 8px; text-align: center; border-bottom: 1px solid #f1f5f9;">{l.quantite or 1} {escape(l.unite or "")}</td></tr>'
                        for l in demande.lignes_besoin.all()
                    ])}
                </tbody>
            </table>
        </div>
        <p style="margin: 0;">
            Merci de prendre en compte cette commande et de suivre les modalités convenues avec l'UCP.
        </p>
    """
    return send_notification_email(
        f"Bon de commande UCP : {demande.numero_bon_commande or demande.numero_demande}",
        body,
        recipients,
        html_body=get_html_template(
            "Bon de commande enregistré",
            html_content,
        ),
    )


def notify_delivery_updated(demande):
    recipients = _emails_for_user(demande.demandeur)
    action_url = _build_frontend_url("/demande-achat/dashboard")
    expedition_label = EXPEDITION_LABELS.get(
        demande.etat_expedition,
        demande.etat_expedition or "Mise à jour",
    )

    body = (
        f"Bonjour,\n\n"
        f"Le suivi livraison de la demande {demande.numero_demande} a été mis à jour."
    )
    html_content = f"""
        <p style="margin: 0 0 8px;">Bonjour,</p>
        <p style="margin: 0 0 10px;">Le service Marché vient d'actualiser l'état d'acheminement de votre commande.</p>
        {_render_email_details([
            ("N° Demande", demande.numero_demande, "accent"),
            ("Statut livraison", expedition_label, "info"),
            ("Date prévue", demande.date_arrivee_prevue or demande.date_livraison_prevue or "-", "default"),
        ])}
    """
    return send_notification_email(
        f"Suivi livraison mis a jour : {demande.numero_demande}",
        body,
        recipients,
        html_body=get_html_template(
            "Mise à jour Livraison",
            html_content,
            action_url,
            "Suivre mon colis",
        ),
    )


def notify_reception_recorded(demande):
    recipients = _emails_for_user(demande.demandeur) + _emails_for_group(AGENT_ACHAT_GROUP)
    action_url = _build_frontend_url("/demande-achat/dashboard")

    if demande.statut_reception == DemandeAchat.STATUT_RECEPTION_ECART_DETECTE:
        body = (
            f"Bonjour,\n\n"
            f"Un écart a été détecté lors de la réception de la demande {demande.numero_demande}."
        )
        html_content = f"""
            <p style="margin: 0 0 8px;">Bonjour,</p>
            <p style="margin: 0 0 10px;">
                Le service Marché a enregistré la réception, mais un écart nécessite une action corrective.
            </p>
            {_render_email_details([
                ("N° Demande", demande.numero_demande, "accent"),
                ("Type d'écart", _humanize_identifier(demande.type_ecart), "danger"),
                ("Action corrective", _humanize_identifier(demande.action_corrective), "default"),
            ])}
            <p style="margin: 0;">Le dossier reste ouvert jusqu'à résolution complète.</p>
        """
        return send_notification_email(
            f"Écart détecté à la réception : {demande.numero_demande}",
            body,
            recipients,
            html_body=get_html_template(
                "Écart détecté",
                html_content,
                action_url,
                "Suivre le dossier",
            ),
        )

    body = (
        f"Bonjour,\n\n"
        f"La réception de la demande {demande.numero_demande} a été enregistrée avec succès."
    )
    html_content = f"""
        <p style="margin: 0 0 8px;">Bonjour,</p>
        <p style="margin: 0 0 10px;">Le service Marché vient d'enregistrer une réception conforme pour votre dossier.</p>
        {_render_email_details([
            ("N° Demande", demande.numero_demande, "accent"),
            ("Statut réception", "Réception complète", "success"),
            ("Action requise", "Clôture demandeur", "warning"),
        ])}
        <p style="margin: 0;">Le dossier peut maintenant être clôturé par le demandeur.</p>
    """
    return send_notification_email(
        f"Reception enregistree : {demande.numero_demande}",
        body,
        recipients,
        html_body=get_html_template(
            "Réception validée",
            html_content,
            action_url,
            "Valider et clôturer",
        ),
    )


def notify_reception_issue_resolved(demande):
    recipients = _emails_for_user(demande.demandeur) + _emails_for_group(AGENT_ACHAT_GROUP)
    action_url = _build_frontend_url("/demande-achat/dashboard")

    body = f"Bonjour,\n\nL'écart détecté sur la demande {demande.numero_demande} a été résolu."
    html_content = f"""
        <p style="margin: 0 0 8px;">Bonjour,</p>
        <p style="margin: 0 0 10px;">Le service Marché a confirmé la résolution de l'écart signalé lors de la réception.</p>
        {_render_email_details([
            ("N° Demande", demande.numero_demande, "accent"),
            ("Type d'écart", _humanize_identifier(demande.type_ecart), "default"),
            ("Résolution", "Écart résolu", "success"),
        ])}
        <p style="margin: 0;">Le dossier peut désormais être clôturé par le demandeur.</p>
    """
    return send_notification_email(
        f"Écart résolu : {demande.numero_demande}",
        body,
        recipients,
        html_body=get_html_template(
            "Écart résolu",
            html_content,
            action_url,
            "Clôturer le dossier",
        ),
    )


def notify_demande_closed(demande):
    recipients = _emails_for_user(demande.demandeur) + _emails_for_group(AGENT_ACHAT_GROUP)
    action_url = _build_frontend_url("/demande-achat/dashboard")
    rating_display = (
        f"{demande.niveau_satisfaction}/5"
        if demande.niveau_satisfaction
        else "Non évalué"
    )

    body = f"Bonjour,\n\nLa demande {demande.numero_demande} a été clôturée avec succès."
    html_content = f"""
        <p style="margin: 0 0 8px;">Bonjour,</p>
        <p style="margin: 0 0 10px;">Le parcours d'achat de votre demande est maintenant clôturé officiellement.</p>
        {_render_email_details([
            ("N° Demande", demande.numero_demande, "accent"),
            ("Décision de clôture", _humanize_identifier(demande.statut_final), "success"),
            ("Évaluation fournie", rating_display, "default"),
        ])}
        <p style="margin: 0;">Le dossier reste disponible pour consultation et suivi historique.</p>
    """
    return send_notification_email(
        f"Demande cloturee : {demande.numero_demande}",
        body,
        recipients,
        html_body=get_html_template(
            "Demande Achat Terminée",
            html_content,
            action_url,
            "Consulter l'archive",
        ),
    )
def notify_validation_delay(demande, hours_remaining):
    if demande.statut == DemandeAchat.STATUT_A_COMPLETER:
        recipients = _emails_for_user(demande.demandeur)
        step_label = "Correction demandée"
        action_url = _build_frontend_url(f"/demande-achat/corriger/{demande.id}")
        subject = f"⏳ Plus que 24h : correction attendue ({demande.numero_demande})"
        title = "Rappel : correction attendue"
        action_text = "Corriger le dossier"
        intro_body = (
            f"IMPORTANT - Relance de correction : La demande {demande.numero_demande} "
            f"attend votre mise à jour.\n"
        )
        intro_html = (
            "La demande d'achat suivante attend vos corrections. "
            "Passé l'échéance, elle restera signalée comme action urgente dans le radar."
        )
    else:
        recipients = _emails_for_validation_step(demande.etape_validation_actuelle)
        step_label = STEP_LABELS.get(demande.etape_validation_actuelle, "validation")
        action_url = _build_frontend_url("/validation")
        subject = f"⏳ Plus que 24h : rappel de validation ({demande.numero_demande})"
        title = "Rappel : validation en attente"
        action_text = "Traiter le dossier maintenant"
        intro_body = (
            f"IMPORTANT - Relance de validation : La demande {demande.numero_demande} "
            f"attend votre validation.\n"
        )
        intro_html = (
            "La demande d'achat suivante attend votre validation. "
            "Passé l'échéance, elle sera signalée en retard sur le tableau de bord."
        )

    body = (
        f"{intro_body}"
        f"Il reste environ {hours_remaining} heure(s) avant l'échéance.\n\n"
        f"Objet : {demande.objet}\n"
        f"Action requise : {step_label}\n\n"
        f"Lien d'accès : {action_url}\n"
    )

    html_content = f"""
        <p style="margin: 0 0 8px; color: #b45309; font-weight: 700;">AVERTISSEMENT : Plus que 24h restantes</p>
        <p style="margin: 0 0 10px;">{escape(intro_html)}</p>
        {_render_email_details([
            ("N° Demande", demande.numero_demande, "accent"),
            ("Objet", demande.objet, "default"),
            ("Action requise", step_label, "warning"),
            ("Échéance estimée", f"{hours_remaining}h restantes", "warning"),
        ])}
    """

    return send_notification_email(
        subject,
        body,
        recipients,
        schedule_after_commit=False,
        html_body=get_html_template(
            title,
            html_content,
            action_url,
            action_text,
        ),
    )
