import hashlib
import logging
from decimal import Decimal
from django.db import transaction
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework.exceptions import ValidationError, PermissionDenied

from apps.ouverture_offre.models import OffreOuverture, SeanceOuverture
from apps.evaluation_offre.models import EvaluationOffre, DecisionFinale

from ..models import (
    Contrat,
    StatutContrat,
    EcheancierPaiement,
    DocumentContrat,
    AuditTrailContrat,
)

User = get_user_model()


# ============================================================
# HELPERS
# ============================================================

def _log_audit(
    contrat: Contrat,
    action: str,
    utilisateur: User,
    description: str = "",
    ancien_val: str = "",
    nouveau_val: str = "",
    champ: str = "",
    ip_adresse: str = "",
    navigateur: str = "",
) -> None:
    """
    Crée une ligne dans AuditTrailContrat
    Obligatoire Fonds Mondial
    """
    AuditTrailContrat.objects.create(
        contrat=contrat,
        action=action,
        utilisateur=utilisateur,
        description=description,
        ancienne_valeur=ancien_val,
        nouvelle_valeur=nouveau_val,
        champ_modifie=champ,
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )


def _compute_file_hash(fichier) -> str:
    """
    Calcule le hash SHA256 d'un fichier uploadé
    """
    sha256_hash = hashlib.sha256()
    try:
        fichier.seek(0)
    except (AttributeError, OSError):
        pass

    for chunk in fichier.chunks():
        sha256_hash.update(chunk)

    try:
        fichier.seek(0)
    except (AttributeError, OSError):
        pass

    return sha256_hash.hexdigest()


def _get_classement_info(seance_id: int) -> dict | None:
    """
    Récupère le Rang 1 de la séance d'évaluation
    Retourne: { offre_id, nom_soumissionnaire, score_total, ... }
    """
    from apps.evaluation_offre.services.evaluation_service import get_classement_seance

    try:
        classement = get_classement_seance(seance_id, user=None)  # Service interne
        if not classement.get("lignes"):
            return None

        # Rang 1 = première ligne du classement
        ligne_rang_1 = classement["lignes"][0]
        return {
            "offre_id": ligne_rang_1["offre_id"],
            "nom_soumissionnaire": ligne_rang_1["nom_soumissionnaire"],
            "score_technique": ligne_rang_1["score_technique"],
            "score_financier": ligne_rang_1["score_financier"],
            "score_total": ligne_rang_1["score_total"],
            "rang": 1,
        }
    except Exception:
        return None


# ============================================================
# CRÉER UN CONTRAT (À PARTIR DU RANG 1)
# ============================================================

@transaction.atomic
def creer_contrat_brouillon(
    seance_id: int,
    offre_id: int,
    utilisateur: User,
    ip_adresse: str = "",
    navigateur: str = "",
) -> Contrat:
    """
    Crée un contrat en BROUILLON à partir du Rang 1 évalué
    Rempli auto les champs depuis l'offre gagnante
    """
    seance = SeanceOuverture.objects.get(id=seance_id)
    offre = OffreOuverture.objects.get(id=offre_id, seance=seance)

    # Vérifier que c'est bien le Rang 1
    classement = _get_classement_info(seance_id)
    if not classement or classement["offre_id"] != offre_id:
        raise ValidationError(
            {"detail": "Cette offre n'est pas classée Rang 1. Impossible de créer un contrat."}
        )

    # Générer le numéro marché si pas déjà existant
    reference = seance.reference_dossier
    numero_marche = reference  # Utilise la référence DAO

    # Vérifier si un contrat existe déjà pour ce DAO
    contrat_existant = Contrat.objects.filter(numero_marche=numero_marche).first()
    if contrat_existant:
        return contrat_existant

    contrat = Contrat.objects.create(
        seance=seance,
        offre_gagnante=offre,
        numero_marche=numero_marche,
        statut=StatutContrat.BROUILLON,
        nom_prestataire=offre.nom_soumissionnaire,
        email_prestataire="",  # À remplir manuellement
        nif_prestataire=offre.nif_stat or "",
        montant_ttc=offre.montant_global or Decimal("0.00"),
        created_by=utilisateur,
    )

    # Audit
    _log_audit(
        contrat,
        AuditTrailContrat.Action.CREATE,
        utilisateur,
        description=f"Contrat créé en brouillon depuis Rang 1 (offre {offre_id})",
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )

    return contrat


# ============================================================
# METTRE À JOUR UN CONTRAT
# ============================================================

@transaction.atomic
def mettre_a_jour_contrat(
    contrat_id: int,
    donnees: dict,
    utilisateur: User,
    ip_adresse: str = "",
    navigateur: str = "",
) -> Contrat:
    """
    Met à jour un contrat en brouillon
    Champs éditables: email_prestataire, telephone, representant, clauses, durée
    """
    contrat = Contrat.objects.get(id=contrat_id)

    if contrat.statut != StatutContrat.BROUILLON:
        raise ValidationError(
            {"detail": "Seul un contrat en brouillon peut être modifié."}
        )

    old_values = {}
    for champ, valeur in donnees.items():
        if hasattr(contrat, champ):
            old_values[champ] = getattr(contrat, champ)
            setattr(contrat, champ, valeur)

    contrat.save(update_fields=list(donnees.keys()) + ["updated_at"])

    # Audit pour chaque champ
    for champ, ancien_val in old_values.items():
        _log_audit(
            contrat,
            AuditTrailContrat.Action.UPDATE,
            utilisateur,
            champ=champ,
            ancien_val=str(ancien_val),
            nouveau_val=str(donnees[champ]),
            ip_adresse=ip_adresse,
            navigateur=navigateur,
        )

    return contrat


# ============================================================
# AJOUTER UN ÉCHÉANCIER
# ============================================================

def ajouter_echeancier(
    contrat_id: int,
    montant: Decimal,
    pourcentage: int,
    etape: str,
    date_prevue: str,
    utilisateur: User,
) -> EcheancierPaiement:
    """
    Ajoute une ligne d'échéancier
    """
    contrat = Contrat.objects.get(id=contrat_id)

    ligne = EcheancierPaiement.objects.create(
        contrat=contrat,
        montant=montant,
        pourcentage=pourcentage,
        etape=etape,
        date_prevue=date_prevue,
    )

    _log_audit(
        contrat,
        AuditTrailContrat.Action.UPDATE,
        utilisateur,
        description=f"Échéancier ajouté: {pourcentage}% ({etape})",
    )

    return ligne


# ============================================================
# UPLOAD DOCUMENT (PDF SIGNÉ)
# ============================================================

@transaction.atomic
def upload_document_contrat(
    contrat_id: int,
    fichier,
    utilisateur: User,
    ip_adresse: str = "",
    navigateur: str = "",
) -> DocumentContrat:
    """
    Upload le PDF du contrat signé
    Calcule et stocke le hash SHA256
    """
    contrat = Contrat.objects.get(id=contrat_id)

    if contrat.statut != StatutContrat.BROUILLON:
        raise ValidationError(
            {"detail": "Seul un contrat en brouillon peut recevoir un document."}
        )

    # Calculer le hash
    hash_sha256 = _compute_file_hash(fichier)

    # Créer le document
    document = DocumentContrat.objects.create(
        contrat=contrat,
        type_document=DocumentContrat.TypeDocument.CONTRAT_SIGNE,
        fichier=fichier,
        hash_sha256=hash_sha256,
        uploaded_by=utilisateur,
    )

    # Audit
    _log_audit(
        contrat,
        AuditTrailContrat.Action.UPLOAD,
        utilisateur,
        description=f"Document PDF uploadé (SHA256: {hash_sha256[:16]}...)",
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )

    return document


# ============================================================
# ENVOYER LE CONTRAT AU PRESTATAIRE
# ============================================================

@transaction.atomic
def envoyer_contrat_prestataire(
    contrat_id: int,
    utilisateur: User,
    ip_adresse: str = "",
    navigateur: str = "",
) -> dict:
    """
    Change le statut à ATTENTE_SIGNATURE
    Envoie un email au prestataire avec le lien de téléchargement
    """
    contrat = Contrat.objects.get(id=contrat_id)

    # Validations
    if contrat.statut != StatutContrat.BROUILLON:
        raise ValidationError(
            {"detail": "Seul un contrat en brouillon peut être envoyé."}
        )

    if not contrat.email_prestataire:
        raise ValidationError(
            {"detail": "L'email du prestataire est obligatoire."}
        )

    if not contrat.documents.exists():
        raise ValidationError(
            {"detail": "Un document PDF est obligatoire avant d'envoyer."}
        )

    # Changer le statut
    contrat.statut = StatutContrat.ATTENTE_SIGNATURE
    contrat.save(update_fields=["statut", "updated_at"])

    # Audit
    _log_audit(
        contrat,
        AuditTrailContrat.Action.SEND,
        utilisateur,
        description=f"Contrat envoyé au prestataire ({contrat.email_prestataire})",
        ip_adresse=ip_adresse,
        navigateur=navigateur,
    )

    # Envoi de l'email au prestataire
    _send_email_contrat_prestataire(contrat)

    return {
        "statut": "SENT",
        "message": f"Contrat envoyé à {contrat.email_prestataire}",
        "email_prestataire": contrat.email_prestataire,
    }


def _send_email_contrat_prestataire(contrat: Contrat) -> int:
    subject = f"Contrat {contrat.numero_marche} prêt pour signature"
    context = {
        "nom_prestataire": contrat.nom_prestataire,
        "numero_marche": contrat.numero_marche,
        "montant_ttc": contrat.montant_ttc,
        "seance_reference": contrat.seance.reference_dossier,
        "seance_objet": contrat.seance.objet_dossier,
        "url_portail": getattr(settings, "FRONTEND_APP_URL", "http://localhost:3000"),
        "date_signature": contrat.date_signature,
    }

    body = (
        f"Bonjour {contrat.nom_prestataire},\n\n"
        f"Votre contrat {contrat.numero_marche} est prêt pour signature.\n"
        f"Montant TTC : {contrat.montant_ttc}\n"
        f"Référence séance : {contrat.seance.reference_dossier}\n"
        f"Objet : {contrat.seance.objet_dossier or '-'}\n\n"
        "Merci de vous connecter au portail pour télécharger le document signé.\n"
    )
    # Add a direct link to preview/download on the frontend portal
    lien_pdf = f"{getattr(settings, 'FRONTEND_APP_URL', 'http://localhost:3000')}/contrats/{contrat.id}/" 
    context["lien_pdf"] = lien_pdf

    html_message = render_to_string(
        "emails/contractualisation_send_prestataire.html",
        context,
    )

    message = EmailMultiAlternatives(
        subject=subject,
        body=body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=[contrat.email_prestataire],
    )
    message.attach_alternative(html_message, "text/html")

    # Attach the first available PDF document to the email (if present)
    document = contrat.documents.first()
    if document and document.fichier:
        try:
            document.fichier.open('rb')
            file_content = document.fichier.read()
            # Safe filename
            try:
                from os.path import basename
                filename = basename(document.fichier.name)
            except Exception:
                filename = f"{contrat.numero_marche}_contrat.pdf"

            message.attach(filename, file_content, "application/pdf")
        finally:
            try:
                document.fichier.close()
            except Exception:
                pass

    sent = message.send(fail_silently=False)
    return sent


# ============================================================
# RÉCUPÉRER CONTRAT AVEC DÉTAILS
# ============================================================

def get_contrat_detail(contrat_id: int) -> dict:
    """
    Retourne tous les détails du contrat
    """
    contrat = Contrat.objects.prefetch_related(
        "echeancier",
        "documents",
        "audit_trail",
    ).get(id=contrat_id)

    return {
        "id": contrat.id,
        "numero_marche": contrat.numero_marche,
        "statut": contrat.statut,
        "nom_prestataire": contrat.nom_prestataire,
        "email_prestataire": contrat.email_prestataire,
        "telephone_prestataire": contrat.telephone_prestataire,
        "nif_prestataire": contrat.nif_prestataire,
        "stat_prestataire": contrat.stat_prestataire,
        "representant_signataire": contrat.representant_signataire,
        "montant_ttc": str(contrat.montant_ttc),
        "date_signature": contrat.date_signature,
        "duree_execution": contrat.duree_execution,
        "clauses_particulieres": contrat.clauses_particulieres,
        "echeancier": [
            {
                "id": e.id,
                "montant": str(e.montant),
                "pourcentage": e.pourcentage,
                "etape": e.etape,
                "date_prevue": e.date_prevue,
                "statut": e.statut,
            }
            for e in contrat.echeancier.all()
        ],
        "documents": [
            {
                "id": d.id,
                "type": d.type_document,
                "fichier": d.fichier.url if d.fichier else None,
                "hash_sha256": d.hash_sha256,
                "date_upload": d.date_upload,
            }
            for d in contrat.documents.all()
        ],
        "created_at": contrat.created_at,
        "updated_at": contrat.updated_at,
        "created_by": contrat.created_by.username if contrat.created_by else None,
    }
