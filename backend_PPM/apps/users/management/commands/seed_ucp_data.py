from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from apps.users.models.agent import Programme, Poste
from apps.authorization.constants import (
    DEMANDEUR, VALIDATEUR_HIERARCHIQUE, VALIDATEUR_TECHNIQUE,
    FINANCE, RAF, VALIDATEUR_BUDGETAIRE,
    VALIDATEUR_PROGRAMMATIQUE, APPROBATEUR_NATIONAL,
)
from apps.authorization.setup import setup_all_groups


class Command(BaseCommand):
    help = "Initialise les données de test pour les Programmes, Groupes et Postes de l'UCP"

    def handle(self, *args, **options):
        self.stdout.write("Configuration des groupes et permissions...")
        setup_all_groups()
        self.stdout.write(self.style.SUCCESS("Groupes configurés avec leurs permissions"))

        group_names = [
            DEMANDEUR, VALIDATEUR_HIERARCHIQUE, VALIDATEUR_TECHNIQUE,
            FINANCE, RAF, VALIDATEUR_BUDGETAIRE,
            VALIDATEUR_PROGRAMMATIQUE, APPROBATEUR_NATIONAL,
        ]
        groups = {name: Group.objects.get(name=name) for name in group_names}

        # 2. Créer les Programmes
        self.stdout.write("\nInitialisation des Programmes...")
        programmes_data = [
            {"code": "GAVI", "nom": "Alliance Gavi"},
            {"code": "FM", "nom": "Fonds Mondial"},
            {"code": "PARN", "nom": "PARN"},
        ]
        programmes = {}
        for data in programmes_data:
            prog, created = Programme.objects.get_or_create(
                code=data["code"],
                defaults={"nom": data["nom"]}
            )
            programmes[data["code"]] = prog
            if created:
                self.stdout.write(self.style.SUCCESS(f"Programme créé : {data['nom']} ({data['code']})"))

        # 3. Créer les Postes
        self.stdout.write("\nInitialisation des Postes...")
        
        # --- PROGRAMME GAVI ---
        p_gavi = programmes["GAVI"]
        
        # Point Focal GAVI
        pf_gavi, _ = Poste.objects.get_or_create(nom="Point Focal", programme=p_gavi)
        pf_gavi.groups.add(groups["VALIDATEUR_PROGRAMMATIQUE"])
        
        # RAF GAVI
        raf_gavi, _ = Poste.objects.get_or_create(nom="Responsable Administratif Financier", programme=p_gavi)
        raf_gavi.groups.add(groups["RAF"], groups["VALIDATEUR_BUDGETAIRE"])
        raf_gavi.superieurs.add(pf_gavi)
        
        # Chargé de Programme GAVI
        cp_gavi, _ = Poste.objects.get_or_create(nom="Chargé de Programme", programme=p_gavi)
        cp_gavi.groups.add(groups["DEMANDEUR"])
        cp_gavi.superieurs.add(raf_gavi)

        # --- PROGRAMME FONDS MONDIAL (FM) ---
        p_fm = programmes["FM"]
        
        # Coordonnateur National FM
        cn_fm, _ = Poste.objects.get_or_create(nom="Coordonnateur National", programme=p_fm)
        cn_fm.groups.add(groups["APPROBATEUR_NATIONAL"])
        
        # Gestionnaire Programme FM
        gp_fm, _ = Poste.objects.get_or_create(nom="Gestionnaire Programme", programme=p_fm)
        gp_fm.groups.add(groups["VALIDATEUR_TECHNIQUE"])
        gp_fm.superieurs.add(cn_fm)

        # --- PROGRAMME PARN ---
        p_parn = programmes["PARN"]
        
        # Point Focal PARN
        pf_parn, _ = Poste.objects.get_or_create(nom="Point Focal", programme=p_parn)
        pf_parn.groups.add(groups["VALIDATEUR_PROGRAMMATIQUE"])
        
        # RAF PARN
        raf_parn, _ = Poste.objects.get_or_create(nom="Responsable Administratif Financier", programme=p_parn)
        raf_parn.groups.add(groups["RAF"], groups["VALIDATEUR_BUDGETAIRE"])
        raf_parn.superieurs.add(pf_parn)

        self.stdout.write(self.style.SUCCESS("\nTous les postes et supérieurs ont été configurés avec succès !"))
