from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone


from apps.ouverture_offre.models import MembreSeance, SeanceOuverture, OffreOuverture

User = get_user_model()


def list_visible_seances(user):
    return (
        SeanceOuverture.objects.select_related("secretaire", "president")
        .prefetch_related("membres__utilisateur")
        .filter(
            Q(secretaire=user)
            | Q(president=user)
            | Q(membres__utilisateur=user)
        )
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

    membre_ids = validated_data.pop("membre_ids", None)
    offres_data = validated_data.pop("offres", None)

    for attr, value in validated_data.items():
        setattr(seance, attr, value)
    seance.save()

    if membre_ids is not None:
        replace_members(seance, membre_ids)
        
    if offres_data is not None:
        replace_offres(seance, offres_data)
    

    return seance


def replace_members(seance, membre_ids):
    users = User.objects.filter(id__in=membre_ids, is_active=True)
    MembreSeance.objects.filter(seance=seance).delete()
    MembreSeance.objects.bulk_create(
        [MembreSeance(seance=seance, utilisateur=user) for user in users]
    )

@transaction.atomic
def validate_member(seance, user, commentaire=""):
    membre = seance.membres.filter(utilisateur=user).first()

    if not membre:
        raise PermissionDenied({"detail": "Vous n'etes pas membre de cette seance."})

    if not membre.est_present:
        raise ValidationError({"detail": "Ce membre est marque absent pour cette seance."})

    membre.a_valide = True
    membre.commentaire = commentaire
    membre.date_validation = timezone.now()
    membre.save()

    return seance

@transaction.atomic
def validate_president(seance, user, commentaire=""):
    if seance.president_id != user.id:
        raise PermissionDenied({"detail": "Vous n'etes pas le president de cette seance."})

    if seance.president_a_valide:
        raise ValidationError({"detail": "Le president a deja valide cette seance."})

    if seance.membres.filter(est_present=True, a_valide=False).exists():
        raise ValidationError({
            "detail": "Tous les membres presents doivent valider avant le president."
        })

    seance.president_a_valide = True
    seance.president_commentaire = commentaire
    seance.date_validation_president = timezone.now()
    seance.statut = SeanceOuverture.Statut.VALIDEE
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