import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.db import transaction

from apps.achats.models import DemandeAchat, ValidationDemande

logger = logging.getLogger(__name__)

User = get_user_model()

AGENT_ACHAT_GROUP = "AGENT_ACHAT"

STEP_TO_GROUP = {
    DemandeAchat.ETAPE_HIERARCHIQUE: "VALIDATEUR_HIERARCHIQUE",
    DemandeAchat.ETAPE_TECHNIQUE: "VALIDATEUR_TECHNIQUE",
    DemandeAchat.ETAPE_BUDGETAIRE: "VALIDATEUR_BUDGETAIRE",
    DemandeAchat.ETAPE_PROGRAMMATIQUE: "VALIDATEUR_PROGRAMMATIQUE",
    DemandeAchat.ETAPE_APPROBATION_FINALE: "APPROBATEUR_NATIONAL",
}

STEP_LABELS = {
    DemandeAchat.ETAPE_HIERARCHIQUE: "validation hierarchique",
    DemandeAchat.ETAPE_TECHNIQUE: "validation technique",
    DemandeAchat.ETAPE_BUDGETAIRE: "validation budgetaire",
    DemandeAchat.ETAPE_PROGRAMMATIQUE: "validation programmatique",
    DemandeAchat.ETAPE_APPROBATION_FINALE: "approbation finale",
    DemandeAchat.ETAPE_TERMINEE: "validation terminee",
}

DECISION_LABELS = {
    ValidationDemande.DECISION_FAVORABLE: "favorable",
    ValidationDemande.DECISION_DEFAVORABLE: "defavorable",
    ValidationDemande.DECISION_A_COMPLETER: "a completer",
    ValidationDemande.DECISION_APPROUVEE: "approuvee",
    ValidationDemande.DECISION_REJETEE: "rejetee",
    ValidationDemande.DECISION_A_REVOIR: "a revoir",
}

EXPEDITION_LABELS = {
    DemandeAchat.ETAT_EXPEDITION_TRANSIT: "En transit",
    DemandeAchat.ETAT_EXPEDITION_ARRIVE: "Arrivee",
    DemandeAchat.ETAT_EXPEDITION_PARTIEL: "Arrivee partielle",
    DemandeAchat.ETAT_EXPEDITION_RETARD: "Retard",
}


def is_email_notifications_enabled():
    return getattr(settings, "ACHATS_NOTIFICATION_EMAILS_ENABLED", True)


def _build_subject(subject):
    prefix = getattr(settings, "ACHATS_EMAIL_SUBJECT_PREFIX", "")
    return f"{prefix}{subject}".strip()


def _build_frontend_url(path):
    base_url = getattr(settings, "FRONTEND_APP_URL", "http://localhost:3000").rstrip("/")
    return f"{base_url}{path}"


def _get_user_display_name(user):
    if not user:
        return "Utilisateur"

    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username or "Utilisateur"


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


def _dispatch_email(subject, body, recipients, fail_silently):
    if not recipients or not is_email_notifications_enabled():
        return 0

    message = EmailMultiAlternatives(
        subject=_build_subject(subject),
        body=body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=recipients,
        reply_to=getattr(settings, "ACHATS_NOTIFICATION_REPLY_TO", None) or None,
    )

    return message.send(fail_silently=fail_silently)


def send_notification_email(
    subject,
    body,
    recipients,
    *,
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

    body = (
        "Bonjour,\n\n"
        f"La demande {demande.numero_demande} a ete soumise par {demandeur_name}.\n"
        f"Objet : {demande.objet}\n"
        f"Etape en cours : {step_label}\n\n"
        "Vous pouvez la traiter depuis l'espace de validation :\n"
        f"{_build_frontend_url('/validation')}\n"
    )

    return send_notification_email(
        f"Nouvelle demande a valider - {demande.numero_demande}",
        body,
        recipients,
    )


def notify_validation_recorded(demande, validation):
    decision_label = DECISION_LABELS.get(validation.decision, validation.decision)
    step_label = STEP_LABELS.get(validation.etape, validation.etape)
    validateur_name = _get_user_display_name(validation.validateur)

    if validation.decision in [
        ValidationDemande.DECISION_DEFAVORABLE,
        ValidationDemande.DECISION_REJETEE,
        ValidationDemande.DECISION_A_COMPLETER,
        ValidationDemande.DECISION_A_REVOIR,
    ]:
        recipients = _emails_for_user(demande.demandeur)
        body = (
            "Bonjour,\n\n"
            f"Une decision {decision_label} a ete enregistree pour la demande "
            f"{demande.numero_demande}.\n"
            f"Objet : {demande.objet}\n"
            f"Etape : {step_label}\n"
            f"Validateur : {validateur_name}\n\n"
            "Consultez votre tableau de bord pour la suite :\n"
            f"{_build_frontend_url('/dashboard')}\n"
        )
        return send_notification_email(
            f"Mise a jour de votre demande - {demande.numero_demande}",
            body,
            recipients,
        )

    if demande.statut == DemandeAchat.STATUT_VALIDEE:
        recipients = _emails_for_user(demande.demandeur) + _emails_for_group(
            AGENT_ACHAT_GROUP
        )
        body = (
            "Bonjour,\n\n"
            f"La demande {demande.numero_demande} a ete validee a toutes les etapes.\n"
            f"Objet : {demande.objet}\n"
            f"Derniere decision : {decision_label}\n"
            f"Valide par : {validateur_name}\n\n"
            "Le dossier est pret pour la passation :\n"
            f"{_build_frontend_url('/passation')}\n"
        )
        return send_notification_email(
            f"Demande validee - {demande.numero_demande}",
            body,
            recipients,
        )

    next_group = STEP_TO_GROUP.get(demande.etape_validation_actuelle)
    recipients = _emails_for_group(next_group) if next_group else []

    next_step_label = STEP_LABELS.get(demande.etape_validation_actuelle, "validation")

    body = (
        "Bonjour,\n\n"
        f"La demande {demande.numero_demande} est prete pour votre etape de validation.\n"
        f"Objet : {demande.objet}\n"
        f"Etape precedente : {step_label}\n"
        f"Decision enregistree : {decision_label}\n"
        f"Etape a traiter : {next_step_label}\n\n"
        "Vous pouvez la traiter ici :\n"
        f"{_build_frontend_url('/validation')}\n"
    )

    return send_notification_email(
        f"Demande a valider - {demande.numero_demande}",
        body,
        recipients,
    )


def notify_order_issued(demande):
    recipients = _emails_for_user(demande.demandeur)
    body = (
        "Bonjour,\n\n"
        f"Le bon de commande de la demande {demande.numero_demande} a ete enregistre.\n"
        f"Objet : {demande.objet}\n"
        f"Fournisseur : {demande.fournisseur_retenu or '-'}\n"
        f"Bon de commande : {demande.numero_bon_commande or '-'}\n\n"
        "Vous pouvez consulter le detail depuis votre espace :\n"
        f"{_build_frontend_url('/dashboard')}\n"
    )

    return send_notification_email(
        f"Bon de commande emis - {demande.numero_demande}",
        body,
        recipients,
    )


def notify_delivery_updated(demande):
    recipients = _emails_for_user(demande.demandeur)
    expedition_label = EXPEDITION_LABELS.get(
        demande.etat_expedition,
        demande.etat_expedition or "Mise a jour",
    )
    target_path = (
        f"/demande-achat/{demande.id}/reception"
        if demande.statut == DemandeAchat.STATUT_LIVREE
        else "/dashboard"
    )
    body = (
        "Bonjour,\n\n"
        f"Le suivi livraison de la demande {demande.numero_demande} a ete mis a jour.\n"
        f"Objet : {demande.objet}\n"
        f"Etat de livraison : {expedition_label}\n"
        f"Date prevue : {demande.date_arrivee_prevue or demande.date_livraison_prevue or '-'}\n\n"
        "Consultez le dossier ici :\n"
        f"{_build_frontend_url(target_path)}\n"
    )

    return send_notification_email(
        f"Suivi livraison mis a jour - {demande.numero_demande}",
        body,
        recipients,
    )


def notify_reception_recorded(demande):
    recipients = _emails_for_user(demande.demandeur) + _emails_for_group(AGENT_ACHAT_GROUP)
    body = (
        "Bonjour,\n\n"
        f"La reception de la demande {demande.numero_demande} a ete enregistree.\n"
        f"Objet : {demande.objet}\n"
        f"Statut de reception : {demande.statut_reception or '-'}\n"
        f"Conformite quantite : {demande.conformite_quantite or '-'}\n"
        f"Conformite qualite : {demande.conformite_qualite or '-'}\n\n"
        "Consultez le dossier ici :\n"
        f"{_build_frontend_url('/dashboard')}\n"
    )

    return send_notification_email(
        f"Reception enregistree - {demande.numero_demande}",
        body,
        recipients,
    )


def notify_demande_closed(demande):
    recipients = _emails_for_user(demande.demandeur) + _emails_for_group(AGENT_ACHAT_GROUP)
    body = (
        "Bonjour,\n\n"
        f"La demande {demande.numero_demande} a ete cloturee.\n"
        f"Objet : {demande.objet}\n"
        f"Statut final : {demande.statut_final or '-'}\n"
        f"Niveau de satisfaction : {demande.niveau_satisfaction or '-'}\n\n"
        "Le detail reste disponible dans l'application :\n"
        f"{_build_frontend_url('/demande-achat/liste')}\n"
    )

    return send_notification_email(
        f"Demande cloturee - {demande.numero_demande}",
        body,
        recipients,
    )
