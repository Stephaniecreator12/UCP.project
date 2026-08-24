from django.db import migrations

from apps.contractualisation.models.contrat import StatutContrat, DocumentContrat
from apps.procurement.models.procurement_market import (
    CategoryType,
    FinancingSource,
    ProcedureType,
    PublicationStatus,
)


def _merge_choices(*choice_sets):
    merged = []
    seen = set()
    for choices in choice_sets:
        for code, label in choices:
            if code not in seen:
                seen.add(code)
                merged.append((code, label))
    return merged


SEED_DATA = {
    "PROCEDURE_TYPE": _merge_choices(ProcedureType.choices),
    "CATEGORY_TYPE": _merge_choices(CategoryType.choices),
    "PUBLICATION_STATUS": _merge_choices(PublicationStatus.choices),
    "FINANCING_SOURCE": _merge_choices(FinancingSource.choices),
    "CONTRAT_STATUT": _merge_choices(StatutContrat.choices),
    "DOCUMENT_TYPE_CONTRAT": _merge_choices(
        DocumentContrat.TypeDocument.choices
    ),
}


def seed_default_choices(apps, schema_editor):
    ReferenceChoice = apps.get_model("common", "ReferenceChoice")
    for group, choices in SEED_DATA.items():
        for sort_order, (code, label) in enumerate(choices):
            ReferenceChoice.objects.update_or_create(
                group=group,
                code=code,
                defaults={"label": label, "sort_order": sort_order, "is_active": True},
            )


def unseed_default_choices(apps, schema_editor):
    ReferenceChoice = apps.get_model("common", "ReferenceChoice")
    groups = list(SEED_DATA.keys())
    ReferenceChoice.objects.filter(group__in=groups).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_default_choices, unseed_default_choices),
    ]
