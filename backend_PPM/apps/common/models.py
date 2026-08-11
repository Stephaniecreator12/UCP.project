from django.db import models
from django.db.utils import DatabaseError


class ChoiceGroup(models.TextChoices):
    PROCEDURE_TYPE = "PROCEDURE_TYPE", "Type de procédure"
    CATEGORY_TYPE = "CATEGORY_TYPE", "Catégorie d'achat"
    PUBLICATION_STATUS = "PUBLICATION_STATUS", "Statut de publication"
    FINANCING_SOURCE = "FINANCING_SOURCE", "Source de financement"
    CONTRAT_STATUT = "CONTRAT_STATUT", "Statut de contrat"
    DOCUMENT_TYPE_CONTRAT = "DOCUMENT_TYPE_CONTRAT", "Type de document contrat"


class ReferenceChoice(models.Model):
    group = models.CharField(
        max_length=64,
        choices=ChoiceGroup.choices,
        db_index=True,
    )
    code = models.CharField(max_length=64)
    label = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["group", "sort_order", "code"]
        constraints = [
            models.UniqueConstraint(
                fields=["group", "code"],
                name="unique_group_code",
            )
        ]
        verbose_name = "Choix de référence"
        verbose_name_plural = "Choix de référence"

    def __str__(self):
        return f"[{self.group}] {self.code} — {self.label}"


def reference_choices(group, default_choices=()):
    """Renvoie les choix actifs stockés en base pour `group`.

    Les valeurs en base font foi (elles sont éditables via l'admin Django).
    Si la table n'existe pas encore ou ne contient aucun enregistrement,
    on retombe sur `default_choices` pour ne jamais casser l'application.
    """
    try:
        values = list(
            ReferenceChoice.objects.filter(group=group, is_active=True)
            .order_by("sort_order", "code")
            .values_list("code", "label")
        )
    except DatabaseError:
        values = []
    return values or list(default_choices)


def reference_codes(group, default_choices=()):
    """Renvoie la liste des codes actifs pour `group` (validation API)."""
    return [code for code, _ in reference_choices(group, default_choices)]
