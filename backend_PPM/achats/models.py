from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class DemandeAchat(models.Model):
    TYPE_MARCHE_CHOICES = [
        ("Biens", "Biens"),
        ("Services", "Services"),
        ("Travaux", "Travaux"),
    ]

    NATURE_ACTIVITE_CHOICES = [
        ("Formation / Atelier", "Formation / Atelier"),
        ("Réunion / Séminaire", "Réunion / Séminaire"),
        ("Mission de supervision / Suivi-évaluation", "Mission de supervision / Suivi-évaluation"),
        ("Revue", "Revue"),
        ("Construction / Réhabilitation", "Construction / Réhabilitation"),
        ("Autre", "Autre"),
    ]

    SOURCE_FINANCEMENT_CHOICES = [
        ("Fonds Mondial", "Fonds Mondial"),
        ("Gavi", "Gavi"),
        ("Banque mondiale", "Banque mondiale"),
        ("Budget Etat (Contrepartie)", "Budget Etat (Contrepartie)"),
        ("Autre", "Autre"),
    ]

    DEVISE_CHOICES = [
        ("USD", "USD"),
        ("EUR", "EUR"),
        ("FCFA", "FCFA"),
    ]

    STATUT_CHOICES = [
        ("Brouillon", "Brouillon"),
        ("Soumise", "Soumise"),
        ("Validée Budget", "Validée Budget"),
        ("Validée Direction", "Validée Direction"),
        ("Rejetée", "Rejetée"),
        ("Transmise aux Marchés", "Transmise aux Marchés"),
    ]

    DECISION_CHOICES = [
        ("", ""),
        ("Approuvé", "Approuvé"),
        ("Rejeté", "Rejeté"),
    ]

    FONDS_CHOICES = [
        ("", ""),
        ("Fonds disponibles", "Fonds disponibles"),
        ("Fonds insuffisants", "Fonds insuffisants"),
    ]

    numero_demande = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        help_text="Genere automatiquement au format UCP/DA/ANNEE/SEQUENCE.",
    )
    date_demande = models.DateField(default=timezone.localdate)
    service_demandeur = models.CharField(max_length=100)
    nom_demandeur = models.CharField(max_length=150)
    fonction_demandeur = models.CharField(max_length=100)

    activite_ptba = models.CharField(max_length=200)
    sous_activite_ptba = models.CharField(max_length=200)
    indicateur_performance = models.CharField(max_length=200, blank=True)
    source_financement = models.JSONField(default=list)
    source_financement_subvention_fm = models.CharField(max_length=200, blank=True)
    source_financement_projet_bm = models.CharField(max_length=200, blank=True)
    source_financement_autre = models.CharField(max_length=200, blank=True)
    ligne_budgetaire = models.CharField(max_length=100)
    budget_estime = models.DecimalField(max_digits=12, decimal_places=2)
    devise = models.CharField(max_length=10, choices=DEVISE_CHOICES, default="USD")

    type_marche = models.CharField(max_length=20, choices=TYPE_MARCHE_CHOICES)
    nature_activite = models.CharField(max_length=50, choices=NATURE_ACTIVITE_CHOICES, blank=True)
    nature_activite_autre = models.CharField(max_length=200, blank=True)
    intitule_demande = models.CharField(max_length=255)
    description_detaillee = models.TextField()
    fichier_joint = models.FileField(
        upload_to="demandes_achats/pieces_jointes/",
        blank=True,
        null=True,
    )

    region_district = models.CharField(max_length=100)
    adresse_precise = models.TextField()
    date_debut_souhaitee = models.DateField()
    date_fin_souhaitee = models.DateField()
    urgent = models.BooleanField(default=False)
    justification_urgence = models.TextField(blank=True)

    statut = models.CharField(max_length=30, choices=STATUT_CHOICES, default="Brouillon")

    validateur1_nom = models.CharField(max_length=150, blank=True)
    validateur1_date = models.DateField(blank=True, null=True)
    validateur1_decision = models.CharField(max_length=20, choices=DECISION_CHOICES, blank=True)
    validateur1_commentaire = models.TextField(blank=True)

    validateur2_nom = models.CharField(max_length=150, blank=True)
    validateur2_date = models.DateField(blank=True, null=True)
    validateur2_fonds = models.CharField(max_length=30, choices=FONDS_CHOICES, blank=True)
    validateur2_visa = models.CharField(max_length=150, blank=True)

    validateur3_nom = models.CharField(max_length=150, blank=True)
    validateur3_date = models.DateField(blank=True, null=True)
    validateur3_visa = models.CharField(max_length=150, blank=True)

    date_transmission_marches = models.DateField(blank=True, null=True)

    demandeur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="demandes_achat",
    )



    def clean(self):
        if not isinstance(self.source_financement, list):
            raise ValidationError({"source_financement": "Ce champ doit contenir une liste."})

        valeurs_valides = {value for value, _label in self.SOURCE_FINANCEMENT_CHOICES}
        invalides = [value for value in self.source_financement if value not in valeurs_valides]
        if invalides:
            raise ValidationError(
                {"source_financement": f"Valeurs invalides: {', '.join(invalides)}"}
            )

        if self.date_fin_souhaitee and self.date_debut_souhaitee:
            if self.date_fin_souhaitee < self.date_debut_souhaitee:
                raise ValidationError(
                    {
                        "date_fin_souhaitee": (
                            "La date de fin doit etre posterieure ou egale a la date de debut."
                        )
                    }
                )

        if self.urgent and not self.justification_urgence.strip():
            raise ValidationError(
                {"justification_urgence": "La justification est obligatoire si la demande est urgente."}
            )

        if "Fonds Mondial" in self.source_financement and not self.source_financement_subvention_fm.strip():
            raise ValidationError(
                {"source_financement_subvention_fm": "Precise la subvention Fonds Mondial."}
            )

        if "Banque mondiale" in self.source_financement and not self.source_financement_projet_bm.strip():
            raise ValidationError(
                {"source_financement_projet_bm": "Precise le projet Banque mondiale."}
            )

        if "Autre" in self.source_financement and not self.source_financement_autre.strip():
            raise ValidationError(
                {"source_financement_autre": "Precise l'autre source de financement."}
            )

        if self.nature_activite == "Autre" and not self.nature_activite_autre.strip():
            raise ValidationError(
                {"nature_activite_autre": "Precise la nature d'activite lorsque 'Autre' est selectionne."}
            )

    def save(self, *args, **kwargs):
        if not self.numero_demande:
            annee = timezone.localdate().year
            prefix = f"UCP/DA/{annee}/"
            dernier = (
                DemandeAchat.objects.filter(numero_demande__startswith=prefix)
                .order_by("-numero_demande")
                .first()
            )
            sequence = 1
            if dernier and dernier.numero_demande:
                try:
                    sequence = int(dernier.numero_demande.split("/")[-1]) + 1
                except (TypeError, ValueError):
                    sequence = 1
            self.numero_demande = f"{prefix}{sequence:04d}"

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.numero_demande or 'Sans numero'} - {self.intitule_demande}"
