from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.utils.translation import gettext_lazy as _

from .models.user import UserProfile


class UserProfileCreationForm(forms.ModelForm):
    password1 = forms.CharField(
        label=_("Mot de passe"),
        widget=forms.PasswordInput,
    )

    password2 = forms.CharField(
        label=_("Confirmation du mot de passe"),
        widget=forms.PasswordInput,
    )

    class Meta:
        model = UserProfile
        fields = (
            "email",
            "full_name",
            "phone",
            "type_entite",
            "nif",
        )

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Les mots de passe ne correspondent pas.")

        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])

        if commit:
            user.save()

        return user


class UserProfileChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField(
        label=_("Mot de passe"),
        help_text=_(
            "Les mots de passe ne sont pas stockés en clair. "
            "Vous pouvez les modifier via le formulaire dédié."
        ),
    )

    class Meta:
        model = UserProfile
        fields = "__all__"

    def clean_password(self):
        return self.initial["password"]