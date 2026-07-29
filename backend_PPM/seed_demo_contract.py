import hashlib
import os
import sys
import django

ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, ROOT)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.files.base import ContentFile
from apps.ouverture_offre.models import SeanceOuverture, OffreOuverture
from apps.contractualisation.models import Contrat, DocumentContrat
from apps.authorization.constants import SECRETAIRE_CONTRACTUALISATION
from apps.authorization.setup import setup_all_groups

User = get_user_model()


def create_demo_pdf(name: str) -> tuple[ContentFile, str]:
    pdf_content = b"""%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Contrat de d\xc3\xa9monstration) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000111 00000 n \n0000000217 00000 n \n0000000291 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n352\n%%EOF\n"""
    file_hash = hashlib.sha256(pdf_content).hexdigest()
    return ContentFile(pdf_content, name=name), file_hash


def ensure_document_for_contrat(contrat: Contrat, user: User, filename: str) -> None:
    if not contrat.documents.exists():
        demo_file, file_hash = create_demo_pdf(filename)
        DocumentContrat.objects.create(
            contrat=contrat,
            type_document=DocumentContrat.TypeDocument.CONTRAT_SIGNE,
            fichier=demo_file,
            hash_sha256=file_hash,
            uploaded_by=user,
        )
        print(f"Document PDF attaché au contrat {contrat.numero_marche}")


def main():
    setup_all_groups()

    group = Group.objects.get(name=SECRETAIRE_CONTRACTUALISATION)

    user, created = User.objects.get_or_create(
        username="demo_secretaire_contractualisation",
        defaults={
            "email": "demo.contractualisation@ucp.local",
            "first_name": "Demo",
            "last_name": "Contractualisation",
            "is_active": True,
        },
    )
    if created:
        user.set_password("secret123")
        user.save(update_fields=["password"])
        print("Utilisateur demo_secretaire_contractualisation créé avec mot de passe secret123")
    else:
        print("Utilisateur demo_secretaire_contractualisation déjà existant")

    user.groups.add(group)

    contract_data = [
        {
            "reference": "UCP/DAO/2026/0051",
            "objet": "Fourniture box wifi pour UCP",
            "contract_number": "UCP/DAO/2026/0051",
            "prestataire": "TECH SOLUTIONS SARL",
            "email": "contact@techsolutions.mg",
            "telephone": "0321234567",
            "nif": "1234567890",
            "stat": "12345 67 2026",
            "representant": "M. RAKOTO Jean Paul",
            "montant": "24500000.00",
            "duree_execution": "3 mois",
            "clauses": "Livraison Antananarivo, paiement à réception",
            "statut": "BROUILLON",
            "filename": "UCP_DAO_2026_0051_contrat.pdf",
            "offres": [
                {
                    "ordre_passage": 1,
                    "nom_soumissionnaire": "TECH SOLUTIONS SARL",
                    "pli_existe": True,
                    "date_reception_pli": "2026-07-10",
                    "heure_reception_pli": "08:30",
                    "enveloppe_administrative": "RECU",
                    "enveloppe_technique": "RECU",
                    "enveloppe_financiere": "RECU",
                    "montant_global": "24500000",
                    "observations": "Offre retenue.",
                    "nif_stat": "1234567890",
                },
                {
                    "ordre_passage": 2,
                    "nom_soumissionnaire": "PRINT PRO SARL",
                    "pli_existe": True,
                    "date_reception_pli": "2026-07-10",
                    "heure_reception_pli": "08:45",
                    "enveloppe_administrative": "RECU",
                    "enveloppe_technique": "RECU",
                    "enveloppe_financiere": "RECU",
                    "montant_global": "26000000",
                    "observations": "Offre concurrente.",
                    "nif_stat": "0987654321",
                },
            ],
        },
        {
            "reference": "UCP/DAO/2026/0052",
            "objet": "Maintenance du parc informatique UCP",
            "contract_number": "UCP/DAO/2026/0052",
            "prestataire": "NETSERVE MADAGASCAR",
            "email": "contact@netserve.mg",
            "telephone": "0329876543",
            "nif": "1122334455",
            "stat": "54321 00 2026",
            "representant": "Mme RASOAMANANA Lila",
            "montant": "18500000.00",
            "duree_execution": "6 mois",
            "clauses": "Assistance 24/7 et mise à jour trimestrielle",
            "statut": "ATTENTE_SIGNATURE",
            "filename": "UCP_DAO_2026_0052_contrat.pdf",
            "offres": [
                {
                    "ordre_passage": 1,
                    "nom_soumissionnaire": "NETSERVE MADAGASCAR",
                    "pli_existe": True,
                    "date_reception_pli": "2026-07-11",
                    "heure_reception_pli": "09:00",
                    "enveloppe_administrative": "RECU",
                    "enveloppe_technique": "RECU",
                    "enveloppe_financiere": "RECU",
                    "montant_global": "18500000",
                    "observations": "Offre retenue.",
                    "nif_stat": "1122334455",
                },
                {
                    "ordre_passage": 2,
                    "nom_soumissionnaire": "DIGI-TECH SARL",
                    "pli_existe": True,
                    "date_reception_pli": "2026-07-11",
                    "heure_reception_pli": "09:15",
                    "enveloppe_administrative": "RECU",
                    "enveloppe_technique": "RECU",
                    "enveloppe_financiere": "RECU",
                    "montant_global": "19250000",
                    "observations": "Offre concurrente.",
                    "nif_stat": "5566778899",
                },
            ],
        },
    ]

    for contract_attrs in contract_data:
        reference = contract_attrs["reference"]
        seance, seance_created = SeanceOuverture.objects.get_or_create(
            reference_dossier=reference,
            defaults={
                "objet_dossier": contract_attrs["objet"],
                "lieu": "Antananarivo",
                "date_seance": "2026-07-14",
                "heure_seance": "09:00",
                "observations": "Séance d'ouverture fictive pour démonstration.",
                "secretaire": user,
                "statut": SeanceOuverture.Statut.BROUILLON,
                "etape_ouverture": SeanceOuverture.EtapeOuverture.COMPLETE,
                "etat_scelle": SeanceOuverture.EtatScelle.INTACT,
            },
        )
        if seance_created:
            print(f"Séance d'ouverture '{reference}' créée")
        else:
            print(f"Séance d'ouverture '{reference}' déjà existante")

        for offre_attrs in contract_attrs["offres"]:
            offre, created = OffreOuverture.objects.update_or_create(
                seance=seance,
                ordre_passage=offre_attrs["ordre_passage"],
                defaults=offre_attrs,
            )
            if created:
                print(f"Offre {offre.nom_soumissionnaire} créée")
            else:
                print(f"Offre {offre.nom_soumissionnaire} mise à jour")

        contrat, created = Contrat.objects.get_or_create(
            numero_marche=contract_attrs["contract_number"],
            defaults={
                "seance": seance,
                "offre_gagnante": OffreOuverture.objects.filter(seance=seance, ordre_passage=1).first(),
                "statut": contract_attrs["statut"],
                "nom_prestataire": contract_attrs["prestataire"],
                "email_prestataire": contract_attrs["email"],
                "telephone_prestataire": contract_attrs["telephone"],
                "nif_prestataire": contract_attrs["nif"],
                "stat_prestataire": contract_attrs["stat"],
                "representant_signataire": contract_attrs["representant"],
                "montant_ttc": contract_attrs["montant"],
                "duree_execution": contract_attrs["duree_execution"],
                "clauses_particulieres": contract_attrs["clauses"],
                "created_by": user,
            },
        )
        if created:
            print(f"Contrat '{contract_attrs['contract_number']}' créé en statut {contract_attrs['statut']}.")
        else:
            if contrat.statut != contract_attrs["statut"]:
                contrat.statut = contract_attrs["statut"]
                contrat.save(update_fields=["statut", "updated_at"])
                print(f"Contrat '{contract_attrs['contract_number']}' mis à jour au statut {contract_attrs['statut']}." )
            else:
                print(f"Contrat '{contract_attrs['contract_number']}' déjà existant avec statut {contrat.statut}.")

        ensure_document_for_contrat(contrat, user, contract_attrs["filename"])

    alice_user, alice_created = User.objects.get_or_create(
        username="alice",
        defaults={
            "email": "alice@ucp.mg",
            "first_name": "Alice",
            "last_name": "DUPONT",
            "is_active": True,
        },
    )
    if alice_created:
        alice_user.set_password("secret123")
        alice_user.save(update_fields=["password"])
        print("Utilisateur alice@ucp.mg créé avec mot de passe secret123")
    else:
        print("Utilisateur alice@ucp.mg déjà existant")

    alice_user.groups.add(group)

    print("Seed de démonstration terminé.")


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    main()
