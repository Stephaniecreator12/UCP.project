from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone


from apps.ouverture_offre.models import MembreSeance, SeanceOuverture, OffreOuverture
from .notification_service import (
    notify_members_validation_requested,
    notify_president_validation_requested,
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


@transaction.atomic
def create_seance(validated_data, user):
    offres_data = validated_data.pop("offres", [])
    membre_ids = validated_data.pop("membre_ids", [])
    seance = SeanceOuverture.objects.create(secretaire=user, **validated_data)
    replace_members(seance, membre_ids)
    replace_offres(seance, offres_data)
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
    offres_data = validated_data.pop("offres", None)

    for attr, value in validated_data.items():
        setattr(seance, attr, value)
    seance.save()

    if membre_ids is not None:
        replace_members(seance, membre_ids)
        
    if offres_data is not None:
        replace_offres(seance, offres_data)

    if seance.statut == SeanceOuverture.Statut.EN_VALIDATION_MEMBRES:
        if seance.membres.filter(est_present=True).count() < 3:
            raise ValidationError({
                "detail": "La commission doit contenir au minimum 3 membres presents hors president."
            })

        if not seance.president_id:
            raise ValidationError({"detail": "Le president de seance est obligatoire avant validation."})

    if (
        previous_status != SeanceOuverture.Statut.EN_VALIDATION_MEMBRES
        and seance.statut == SeanceOuverture.Statut.EN_VALIDATION_MEMBRES
    ):
        notify_members_validation_requested(seance)

    return seance


def replace_members(seance, membre_ids):
    users = User.objects.filter(id__in=membre_ids, is_active=True)
    MembreSeance.objects.filter(seance=seance).delete()
    MembreSeance.objects.bulk_create(
        [MembreSeance(seance=seance, utilisateur=user) for user in users]
    )

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

    membre.a_valide = True
    membre.decision = MembreSeance.Decision.VALIDEE
    membre.commentaire = commentaire
    membre.date_validation = timezone.now()
    membre.ip_adresse = ip_adresse
    membre.navigateur = navigateur
    membre.save()

    if not seance.membres.filter(est_present=True).exclude(
        decision=MembreSeance.Decision.VALIDEE
    ).exists():
        seance.statut = SeanceOuverture.Statut.EN_VALIDATION_PRESIDENT
        seance.save(update_fields=["statut", "updated_at"])
        notify_president_validation_requested(seance)

    return seance


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

    membre.a_valide = False
    membre.decision = MembreSeance.Decision.REJETEE
    membre.commentaire = commentaire
    membre.date_validation = timezone.now()
    membre.ip_adresse = ip_adresse
    membre.navigateur = navigateur
    membre.save()

    seance.statut = SeanceOuverture.Statut.REJETEE
    seance.president_a_valide = False
    seance.president_decision = SeanceOuverture.Decision.EN_ATTENTE
    seance.save(update_fields=["statut", "president_a_valide", "president_decision", "updated_at"])

    return seance

@transaction.atomic
def validate_president(seance, user, commentaire="", ip_adresse=None, navigateur=""):
    if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_PRESIDENT:
        raise ValidationError({"detail": "La seance doit etre en validation president."})

    if seance.president_id != user.id:
        raise PermissionDenied({"detail": "Vous n'etes pas le president de cette seance."})

    if seance.president_decision != SeanceOuverture.Decision.EN_ATTENTE:
        raise ValidationError({"detail": "Le president a deja traite cette seance."})

    if seance.membres.filter(est_present=True).exclude(decision=MembreSeance.Decision.VALIDEE).exists():
        raise ValidationError({
            "detail": "Tous les membres presents doivent valider avant le president."
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

    return seance


@transaction.atomic
def reject_president(seance, user, commentaire="", ip_adresse=None, navigateur=""):
    if seance.statut != SeanceOuverture.Statut.EN_VALIDATION_PRESIDENT:
        raise ValidationError({"detail": "La seance doit etre en validation president."})

    if seance.president_id != user.id:
        raise PermissionDenied({"detail": "Vous n'etes pas le president de cette seance."})

    if seance.president_decision != SeanceOuverture.Decision.EN_ATTENTE:
        raise ValidationError({"detail": "Le president a deja traite cette seance."})

    seance.president_a_valide = False
    seance.president_decision = SeanceOuverture.Decision.REJETEE
    seance.president_commentaire = commentaire
    seance.date_validation_president = timezone.now()
    seance.president_ip_adresse = ip_adresse
    seance.president_navigateur = navigateur
    seance.statut = SeanceOuverture.Statut.REJETEE
    seance.save()

    return seance

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
