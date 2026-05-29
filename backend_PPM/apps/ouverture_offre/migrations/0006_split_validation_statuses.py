from django.db import migrations, models


def forwards(apps, schema_editor):
    SeanceOuverture = apps.get_model("ouverture_offre", "SeanceOuverture")

    for seance in SeanceOuverture.objects.filter(statut="A_VALIDER").iterator():
        pending_members = seance.membres.filter(est_present=True).exclude(
            decision="VALIDEE",
        ).exists()
        seance.statut = (
            "EN_VALIDATION_MEMBRES"
            if pending_members
            else "EN_VALIDATION_PRESIDENT"
        )
        seance.save(update_fields=["statut"])


def backwards(apps, schema_editor):
    SeanceOuverture = apps.get_model("ouverture_offre", "SeanceOuverture")
    SeanceOuverture.objects.filter(
        statut__in=["EN_VALIDATION_MEMBRES", "EN_VALIDATION_PRESIDENT"],
    ).update(statut="A_VALIDER")
    SeanceOuverture.objects.filter(statut="ARCHIVEE").update(statut="VALIDEE")


class Migration(migrations.Migration):

    dependencies = [
        ("ouverture_offre", "0005_membreseance_decision_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="seanceouverture",
            name="statut",
            field=models.CharField(
                choices=[
                    ("BROUILLON", "Brouillon"),
                    ("EN_SAISIE", "En saisie"),
                    ("EN_VALIDATION_MEMBRES", "En validation membres"),
                    ("EN_VALIDATION_PRESIDENT", "En validation president"),
                    ("VALIDEE", "Validee"),
                    ("REJETEE", "Rejetee"),
                    ("ARCHIVEE", "Archivee"),
                ],
                db_index=True,
                default="BROUILLON",
                max_length=32,
            ),
        ),
        migrations.RunPython(forwards, backwards),
    ]
