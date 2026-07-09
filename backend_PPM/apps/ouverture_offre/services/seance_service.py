from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
import re


from apps.ouverture_offre.models import MembreSeance, SeanceOuverture, OffreOuverture
from .notification_service import (
    notify_members_validation_requested,
    notify_president_validation_requested,
)
from .validation_access_service import (
    check_president_password,
    clear_member_validation_password,
    clear_president_validation_password,
    get_member_with_password,
)

User = get_user_model()


def list_visible_seances(user):
    return (
        SeanceOuverture.objects.select_related("secretaire", "president")
        .prefetch_related("membres__utilisateur")
        .distinct()
        .order_by("-created_at")
    )


def get_visible_seance(user, pk):
    return list_visible_seances(user).filter(pk=pk).first()


def get_public_validation_seance(pk):
    return (
        SeanceOuverture.objects.select_related("secretaire", "president")
        .prefetch_related("membres__utilisateur", "offres")
        .filter(pk=pk)
        .first()
    )


def reset_validation_state(seance):
    seance.membres.update(
        a_valide=False,
        decision=MembreSeance.Decision.EN_ATTENTE,
        commentaire="",
        date_validation=None,
        ip_adresse=None,
        navigateur="",
        validation_password_hash="",
        validation_password_generated_at=None,
        validation_password_consumed_at=None,
    )
    seance.president_a_valide = False
    seance.president_decision = SeanceOuverture.Decision.EN_ATTENTE
    seance.president_commentaire = ""
    seance.date_validation_president = None
    seance.president_ip_adresse = None
    seance.president_navigateur = ""
    seance.president_validation_password_hash = ""
    seance.president_validation_password_generated_at = None
    seance.president_validation_password_consumed_at = None
    seance.save(
        update_fields=[
            "president_a_valide",
            "president_decision",
            "president_commentaire",
            "date_validation_president",
            "president_ip_adresse",
            "president_navigateur",
            "president_validation_password_hash",
            "president_validation_password_generated_at",
            "president_validation_password_consumed_at",
            "updated_at",
        ]
    )


def resend_validation_notifications(seance, user):
    if seance.statut not in [
        SeanceOuverture.Statut.EN_VALIDATION_MEMBRES,
        SeanceOuverture.Statut.EN_VALIDATION_PRESIDENT,
    ]:
        return {"detail": "Aucune notification de validation à renvoyer pour cette séance."}

    reset_validation_state(seance)
    if seance.statut == SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
        sent_members = notify_members_validation_requested(seance)
        setattr(seance, "_emails_envoyes", sent_members)
        return {
            "detail": "Notifications de validation renvoyées.",
            "emails_envoyes": sent_members,
        }

    sent_president = notify_president_validation_requested(seance)
    setattr(seance, "_emails_envoyes", sent_president)
    return {
        "detail": "Notifications de validation renvoyées.",
        "emails_envoyes": sent_president,
    }


@transaction.atomic
def create_seance(validated_data, user):
    offres_data = validated_data.pop("offres", [])
    membre_ids = validated_data.pop("membre_ids", [])
    commission_members = validated_data.pop("commission_members", [])
    seance = SeanceOuverture.objects.create(secretaire=user, **validated_data)
    if commission_members:
        replace_members_from_commission(seance, commission_members)
    else:
        replace_members(seance, membre_ids)
    replace_offres(seance, offres_data)
    if seance.statut == SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
        reset_validation_state(seance)
        sent_count = notify_members_validation_requested(seance)
        setattr(seance, "_emails_envoyes", sent_count)
    return seance


@transaction.atomic
def update_seance(seance, validated_data, user):
    if seance.secretaire_id != user.id:
        raise PermissionDenied({"detail": "Seul le secretaire de cette seance peut la modifier."})

    if seance.statut not in [
        SeanceOuverture.Statut.BROUILLON,
        SeanceOuverture.Statut.EN_SAISIE,
    ]:
        raise ValidationError({"detail": "Impossible de modifier une seance deja transmise."})

    previous_status = seance.statut
    membre_ids = validated_data.pop("membre_ids", None)
    commission_members = validated_data.pop("commission_members", None)
    offres_data = validated_data.pop("offres", None)

    for attr, value in validated_data.items():
        setattr(seance, attr, value)
    seance.save()

    if commission_members is not None:
        replace_members_from_commission(seance, commission_members)
    elif membre_ids is not None:
        replace_members(seance, membre_ids)
        
    if offres_data is not None:
        replace_offres(seance, offres_data)

    if seance.statut == SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
        if not seance.president_id:
            raise ValidationError({"detail": "Le president de seance est obligatoire avant validation."})

    if (
        previous_status != SeanceOuverture.Statut.EN_VALIDATION_MEMBRES
        and seance.statut == SeanceOuverture.Statut.EN_VALIDATION_MEMBRES
    ):
        reset_validation_state(seance)
        sent_count = notify_members_validation_requested(seance)
        setattr(seance, "_emails_envoyes", sent_count)

    return seance


def _user_display_name(user):
    return f"{user.first_name} {user.last_name}".strip() or user.username


def replace_members(seance, membre_ids):
    users_by_id = {
        user.id: user
        for user in User.objects.filter(id__in=membre_ids, is_active=True)
    }
    users = [users_by_id[user_id] for user_id in membre_ids if user_id in users_by_id]
    MembreSeance.objects.filter(seance=seance).delete()
    MembreSeance.objects.bulk_create(
        [
            MembreSeance(
                seance=seance,
                utilisateur=user,
                nom_prenom=_user_display_name(user),
            )
            for user in users
        ]
    )


def _split_member_name(full_name):
    parts = (full_name or "").strip().split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def _unique_username_from_email(email):
    base = re.sub(r"[^a-zA-Z0-9_@.+-]", "", email.split("@", 1)[0]).strip()
    base = base or "commission"
    username = base
    counter = 1
    while User.objects.filter(username=username).exists():
        counter += 1
        username = f"{base}{counter}"
    return username


def _get_or_create_commission_user(member):
    email = member["email"].strip().lower()
    user = User.objects.filter(email__iexact=email).first()
    first_name, last_name = _split_member_name(member.get("nomPrenom", ""))

    if user:
        changed_fields = []
        if not user.first_name and first_name:
            user.first_name = first_name
            changed_fields.append("first_name")
        if not user.last_name and last_name:
            user.last_name = last_name
            changed_fields.append("last_name")
        if changed_fields:
            user.save(update_fields=changed_fields)
        if not user.is_active:
            raise ValidationError({
                "commission_members": f"Le compte lie a {email} est inactif."
            })
        return user

    user = User(
        username=_unique_username_from_email(email),
        email=email,
        first_name=first_name,
        last_name=last_name,
        is_active=True,
    )
    user.set_unusable_password()
    user.save()
    return user


def replace_members_from_commission(seance, commission_members):
    reserved_emails = set()
    for user_id, field_name in ((seance.secretaire_id, "secretaire"), (seance.president_id, "president")):
        if not user_id:
            continue
        email = User.objects.filter(id=user_id).values_list("email", flat=True).first()
        if email:
            reserved_emails.add(email.strip().lower())

    for member in commission_members:
        email = (member.get("email") or "").strip().lower()
        if email and email in reserved_emails:
            raise ValidationError(
                "Le membre de commission ne peut pas utiliser l'email du secretaire ou du president."
            )

    # Les membres du formulaire separe deviennent ici de vrais participants de la seance.
    membres = []
    for member in commission_members:
        user = _get_or_create_commission_user(member)
        membres.append(
            MembreSeance(
                seance=seance,
                utilisateur=user,
                nom_prenom=member.get("nomPrenom", "").strip(),
                numero_carte=member.get("cin", "").strip(),
                intitule=member.get("entite", "").strip(),
                poste=member.get("poste", "").strip(),
            )
        )

    MembreSeance.objects.filter(seance=seance).delete()
    MembreSeance.objects.bulk_create(membres)


def _all_present_members_decided(seance):
    return not seance.membres.filter(
        est_present=True,
        decision=MembreSeance.Decision.EN_ATTENTE,
    ).exists()


def _move_to_president_when_members_done(seance):
    if not _all_present_members_decided(seance):
        return

    seance.statut = SeanceOuverture.Statut.EN_VALIDATION_PRESIDENT
    seance.save(update_fields=["statut", "updated_at"])
    notify_president_validation_requested(seance)


def _record_member_decision(membre, decision, commentaire="", ip_adresse=None, navigateur=""):
    membre.a_valide = decision == MembreSeance.Decision.VALIDEE
    membre.decision = decision
    membre.commentaire = commentaire
    membre.date_validation = timezone.now()
    membre.ip_adresse = ip_adresse
    membre.navigateur = navigateur
    membre.save()
    _move_to_president_when_members_done(membre.seance)
    return membre.seance

@transaction.atomic
def validate_member(seance, user, commentaire="", ip_adresse=None, navigateur=""):
    if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
        raise ValidationError({"detail": "La seance doit etre en validation des membres."})

    membre = seance.membres.filter(utilisateur=user).first()

    if not membre:
        raise PermissionDenied({"detail": "Vous n'etes pas membre de cette seance."})

    if not membre.est_present:
        raise ValidationError({"detail": "Ce membre est marque absent pour cette seance."})

    if membre.decision != MembreSeance.Decision.EN_ATTENTE:
        raise ValidationError({"detail": "Vous avez deja traite cette seance."})

    result = _record_member_decision(
        membre,
        MembreSeance.Decision.VALIDEE,
        commentaire=commentaire,
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )
    clear_member_validation_password(membre)
    return result


@transaction.atomic
def reject_member(seance, user, commentaire="", ip_adresse=None, navigateur=""):
    if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
        raise ValidationError({"detail": "La seance doit etre en validation des membres."})

    membre = seance.membres.filter(utilisateur=user).first()

    if not membre:
        raise PermissionDenied({"detail": "Vous n'etes pas membre de cette seance."})

    if not membre.est_present:
        raise ValidationError({"detail": "Ce membre est marque absent pour cette seance."})

    if membre.decision != MembreSeance.Decision.EN_ATTENTE:
        raise ValidationError({"detail": "Vous avez deja traite cette seance."})

    result = _record_member_decision(
        membre,
        MembreSeance.Decision.REJETEE,
        commentaire=commentaire,
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )
    clear_member_validation_password(membre)
    return result

@transaction.atomic
def validate_president(seance, user, commentaire="", ip_adresse=None, navigateur=""):
    if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_PRESIDENT:
        raise ValidationError({"detail": "La seance doit etre en validation president."})

    if seance.president_id != user.id:
        raise PermissionDenied({"detail": "Vous n'etes pas le president de cette seance."})

    if seance.president_decision != SeanceOuverture.Decision.EN_ATTENTE:
        raise ValidationError({"detail": "Le president a deja traite cette seance."})

    if seance.membres.filter(est_present=True, decision=MembreSeance.Decision.EN_ATTENTE).exists():
        raise ValidationError({
            "detail": "Tous les membres presents doivent donner leur avis avant le president."
        })

    seance.president_a_valide = True
    seance.president_decision = SeanceOuverture.Decision.VALIDEE
    seance.president_commentaire = commentaire
    seance.date_validation_president = timezone.now()
    seance.president_ip_adresse = ip_adresse
    seance.president_navigateur = navigateur
    seance.statut = SeanceOuverture.Statut.VALIDEE
    seance.save()

    # Generate and archive PV PDF
    from .pdf_service import generate_and_archive_pv
    generate_and_archive_pv(seance)
    clear_president_validation_password(seance)

    return seance


@transaction.atomic
def reject_president(seance, user, commentaire="", ip_adresse=None, navigateur=""):
    if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_PRESIDENT:
        raise ValidationError({"detail": "La seance doit etre en validation president."})

    if seance.president_id != user.id:
        raise PermissionDenied({"detail": "Vous n'etes pas le president de cette seance."})

    if seance.president_decision != SeanceOuverture.Decision.EN_ATTENTE:
        raise ValidationError({"detail": "Le president a deja traite cette seance."})

    if seance.membres.filter(est_present=True, decision=MembreSeance.Decision.EN_ATTENTE).exists():
        raise ValidationError({
            "detail": "Tous les membres presents doivent donner leur avis avant le president."
        })

    seance.president_a_valide = False
    seance.president_decision = SeanceOuverture.Decision.REJETEE
    seance.president_commentaire = commentaire
    seance.date_validation_president = timezone.now()
    seance.president_ip_adresse = ip_adresse
    seance.president_navigateur = navigateur
    seance.statut = SeanceOuverture.Statut.REJETEE
    seance.save()
    clear_president_validation_password(seance)

    return seance


@transaction.atomic
def report_president(seance, user, report_date, commentaire="", ip_adresse=None, navigateur=""):
    if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_PRESIDENT:
        raise ValidationError({"detail": "La seance doit etre en validation president."})

    if seance.president_id != user.id:
        raise PermissionDenied({"detail": "Vous n'etes pas le president de cette seance."})

    if seance.president_decision != SeanceOuverture.Decision.EN_ATTENTE:
        raise ValidationError({"detail": "Le president a deja traite cette seance."})

    if seance.membres.filter(est_present=True, decision=MembreSeance.Decision.EN_ATTENTE).exists():
        raise ValidationError({
            "detail": "Tous les membres presents doivent donner leur avis avant le president."
        })

    if not report_date:
        raise ValidationError({"date_report": "La date de report est obligatoire."})

    seance.president_a_valide = False
    seance.president_decision = SeanceOuverture.Decision.REPORTEE
    seance.president_commentaire = commentaire
    seance.date_validation_president = timezone.now()
    seance.president_ip_adresse = ip_adresse
    seance.president_navigateur = navigateur
    seance.date_seance = report_date
    seance.statut = SeanceOuverture.Statut.EN_SAISIE
    seance.save()

    seance.membres.update(
        a_valide=False,
        decision=MembreSeance.Decision.EN_ATTENTE,
        commentaire="",
        date_validation=None,
        ip_adresse=None,
        navigateur="",
        validation_password_hash="",
        validation_password_generated_at=None,
        validation_password_consumed_at=None,
    )
    clear_president_validation_password(seance)

    return seance


@transaction.atomic
def validate_member_with_password(seance, email, password, commentaire="", ip_adresse=None, navigateur=""):
    if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
        raise ValidationError({"detail": "La seance doit etre en validation des membres."})

    membre = get_member_with_password(seance, email, password)
    _record_member_decision(
        membre,
        MembreSeance.Decision.VALIDEE,
        commentaire=commentaire,
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )
    clear_member_validation_password(membre)
    return seance


@transaction.atomic
def reject_member_with_password(seance, email, password, commentaire="", ip_adresse=None, navigateur=""):
    if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
        raise ValidationError({"detail": "La seance doit etre en validation des membres."})

    membre = get_member_with_password(seance, email, password)
    _record_member_decision(
        membre,
        MembreSeance.Decision.REJETEE,
        commentaire=commentaire,
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )
    clear_member_validation_password(membre)
    return seance


@transaction.atomic
def validate_president_with_password(seance, email, password, commentaire="", ip_adresse=None, navigateur=""):
    president = check_president_password(seance, email, password)
    return validate_president(
        seance,
        president,
        commentaire=commentaire,
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )


@transaction.atomic
def reject_president_with_password(seance, email, password, commentaire="", ip_adresse=None, navigateur=""):
    president = check_president_password(seance, email, password)
    return reject_president(
        seance,
        president,
        commentaire=commentaire,
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )


@transaction.atomic
def report_president_with_password(
    seance,
    email,
    password,
    report_date,
    commentaire="",
    ip_adresse=None,
    navigateur="",
):
    president = check_president_password(seance, email, password)
    return report_president(
        seance,
        president,
        report_date,
        commentaire=commentaire,
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )

def replace_offres(seance, offres_data):
    OffreOuverture.objects.filter(seance=seance).delete()
    OffreOuverture.objects.bulk_create(
        [
            OffreOuverture(
                seance=seance,
                ordre_passage=offre["ordre_passage"],
                nom_soumissionnaire=offre["nom_soumissionnaire"],
                pli_existe=offre.get("pli_existe", True),
                motif_absence_pli=offre.get("motif_absence_pli", ""),
                date_reception_pli=offre.get("date_reception_pli"),
                heure_reception_pli=offre.get("heure_reception_pli"),
                enveloppe_administrative=offre.get("enveloppe_administrative", ""),
                enveloppe_technique=offre.get("enveloppe_technique", ""),
                enveloppe_financiere=offre.get("enveloppe_financiere", ""),
                montant_global=offre.get("montant_global"),
                observations=offre.get("observations", ""),
            )
            for offre in offres_data
        ]
    )
