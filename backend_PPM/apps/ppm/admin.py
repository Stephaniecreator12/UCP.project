from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from unfold.admin import ModelAdmin

from apps.ppm.models.Travaux import Travaux, FinancingSource as TravauxFinancingSource
from apps.ppm.models.Biens import Biens, FinancingSource as BiensFinancingSource
from apps.ppm.models.Consultances import Consultance, FinancingSource as ConsultanceFinancingSource
from apps.common.models import ChoiceGroup, reference_choices


def _get_financing_choices(FinancingSourceEnum):
    return reference_choices(ChoiceGroup.FINANCING_SOURCE, FinancingSourceEnum.choices)


class BiensAdminForm(forms.ModelForm):
    financing_sources = forms.MultipleChoiceField(
        choices=lambda: _get_financing_choices(BiensFinancingSource),
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label="Sources de financement",
    )

    class Meta:
        model = Biens
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["financing_sources"].initial = self.instance.financing_sources or []

    def clean(self):
        cleaned_data = super().clean()
        financing_sources = cleaned_data.get("financing_sources", [])
        reference_bailleur = cleaned_data.get("reference_bailleur")
        project_code = cleaned_data.get("project_code")

        if financing_sources and len(financing_sources) > 1 and not reference_bailleur:
            self.add_error("reference_bailleur", "Un bailleur référent est obligatoire si plusieurs sources sont sélectionnées.")
        if reference_bailleur and financing_sources and reference_bailleur not in financing_sources:
            self.add_error("reference_bailleur", "Le bailleur référent doit faire partie des sources sélectionnées.")
        if financing_sources and not project_code:
            self.add_error("project_code", "Le code projet est obligatoire lorsque des sources de financement sont renseignées.")
        return cleaned_data


class TravauxAdminForm(forms.ModelForm):
    financing_sources = forms.MultipleChoiceField(
        choices=lambda: _get_financing_choices(TravauxFinancingSource),
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label="Sources de financement",
    )

    class Meta:
        model = Travaux
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["financing_sources"].initial = self.instance.financing_sources or []

    def clean(self):
        cleaned_data = super().clean()
        financing_sources = cleaned_data.get("financing_sources", [])
        reference_bailleur = cleaned_data.get("reference_bailleur")
        project_code = cleaned_data.get("project_code")

        if financing_sources and len(financing_sources) > 1 and not reference_bailleur:
            self.add_error("reference_bailleur", "Un bailleur référent est obligatoire si plusieurs sources sont sélectionnées.")
        if reference_bailleur and financing_sources and reference_bailleur not in financing_sources:
            self.add_error("reference_bailleur", "Le bailleur référent doit faire partie des sources sélectionnées.")
        if financing_sources and not project_code:
            self.add_error("project_code", "Le code projet est obligatoire lorsque des sources de financement sont renseignées.")
        return cleaned_data


class ConsultanceAdminForm(forms.ModelForm):
    financing_sources = forms.MultipleChoiceField(
        choices=lambda: _get_financing_choices(ConsultanceFinancingSource),
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label="Sources de financement",
    )

    class Meta:
        model = Consultance
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["financing_sources"].initial = self.instance.financing_sources or []

    def clean(self):
        cleaned_data = super().clean()
        financing_sources = cleaned_data.get("financing_sources", [])
        reference_bailleur = cleaned_data.get("reference_bailleur")
        project_code = cleaned_data.get("project_code")

        if financing_sources and len(financing_sources) > 1 and not reference_bailleur:
            self.add_error("reference_bailleur", "Un bailleur référent est obligatoire si plusieurs sources sont sélectionnées.")
        if reference_bailleur and financing_sources and reference_bailleur not in financing_sources:
            self.add_error("reference_bailleur", "Le bailleur référent doit faire partie des sources sélectionnées.")
        if financing_sources and not project_code:
            self.add_error("project_code", "Le code projet est obligatoire lorsque des sources de financement sont renseignées.")
        return cleaned_data


@admin.register(Travaux)
class TravauxAdmin(ModelAdmin):
    form = TravauxAdminForm
    list_display = (
        "code_suivi", "intitule", "montant_estimatif", "agmo",
        "methode_pm", "statut", "reference_bailleur", "project_code",
        "date_signature_prevu", "date_signature_reel",
    )
    list_filter = ("statut", "methode_pm", "agmo", "reference_bailleur")
    search_fields = ("code_suivi", "intitule", "commentaire", "project_code")
    list_per_page = 25
    date_hierarchy = "date_lancement_prevu"
    fieldsets = (
        ("Identification", {
            "fields": ("code_suivi", "intitule", "montant_estimatif", "statut"),
        }),
        ("Sources de financement", {
            "fields": ("financing_sources", "reference_bailleur", "project_code"),
        }),
        ("Procédure", {
            "fields": ("agmo", "methode_pm", "approches", "revue"),
        }),
        ("Suivi", {
            "fields": ("listesetspecifications", "prevu", "reel", "commentaire", "duree"),
        }),
        ("Dates prévues", {
            "fields": (
                "dossiers_appel_prevu", "date_lancement_prevu", "date_ouverture_prevu",
                "rapport_evaluation_prevu", "date_signature_prevu", "date_livraison_prevu",
            ),
        }),
        ("Dates réelles", {
            "fields": (
                "dossiers_appel_reel", "date_lancement_reel", "date_ouverture_reel",
                "rapport_evaluation_reel", "date_signature_reel", "date_livraison_reel",
            ),
        }),
    )


@admin.register(Biens)
class BiensAdmin(ModelAdmin):
    form = BiensAdminForm
    list_display = (
        "code_suivi", "intitule", "montant_estimatif", "agmo",
        "methode_epm", "statut", "reference_bailleur", "project_code",
        "date_signature_prevu", "date_signature_reel",
    )
    list_filter = ("statut", "methode_epm", "agmo", "reference_bailleur")
    search_fields = ("code_suivi", "intitule", "commentaire", "project_code")
    list_per_page = 25
    date_hierarchy = "date_lancement_prevu"
    fieldsets = (
        ("Identification", {
            "fields": ("code_suivi", "intitule", "montant_estimatif", "statut"),
        }),
        ("Sources de financement", {
            "fields": ("financing_sources", "reference_bailleur", "project_code"),
        }),
        ("Procédure", {
            "fields": ("agmo", "methode_epm", "approches", "revue"),
        }),
        ("Suivi", {
            "fields": ("listesetspecifications", "prevu", "reel", "commentaire", "duree"),
        }),
        ("Dates prévues", {
            "fields": (
                "dossiers_appel_prevu", "date_lancement_prevu", "date_ouverture_prevu",
                "rapport_evaluation_prevu", "date_signature_prevu", "date_livraison_prevu",
            ),
        }),
        ("Dates réelles", {
            "fields": (
                "dossiers_appel_reel", "date_lancement_reel", "date_ouverture_reel",
                "rapport_evaluation_reel", "date_signature_reel", "date_livraison_reel",
            ),
        }),
    )


@admin.register(Consultance)
class ConsultanceAdmin(ModelAdmin):
    form = ConsultanceAdminForm
    list_display = (
        "ref_code_suivi", "intitule", "montant_estimatif", "methode",
        "approche", "statut", "reference_bailleur", "project_code",
        "date_signature_prevu", "date_signature_reel",
    )
    list_filter = ("statut", "methode", "approche", "reference_bailleur")
    search_fields = ("ref_code_suivi", "intitule", "commentaire", "project_code")
    list_per_page = 25
    date_hierarchy = "date_signature_prevu"
    fieldsets = (
        ("Identification", {
            "fields": ("ref_code_suivi", "intitule", "montant_estimatif", "statut"),
        }),
        ("Sources de financement", {
            "fields": ("financing_sources", "reference_bailleur", "project_code"),
        }),
        ("Procédure", {
            "fields": ("agmoxdirection", "methode", "approche", "revue", "forfaitxtemps"),
        }),
        ("Dates prévues", {
            "fields": (
                "TdR_prevu", "ami_prevu", "liste_restreinte_prevu",
                "demande_proposition_prevu", "date_invitation_prevu",
                "date_ouverture_prevu", "rapport_evaluation_prevu",
                "ouverture_plis_prevu", "projet_contrat_prevu",
                "date_signature_prevu", "date_fin_prevu", "duree",
            ),
        }),
        ("Dates réelles", {
            "fields": (
                "TdR_reel", "ami_reel", "liste_restreinte_reel",
                "demande_proposition_reel", "date_invitation_reel",
                "date_ouverture_reel", "rapport_evaluation_reel",
                "ouverture_plis_reel", "projet_contrat_reel",
                "date_signature_reel", "date_fin_reel",
            ),
        }),
        ("Commentaire", {
            "fields": ("commentaire",),
        }),
    )
