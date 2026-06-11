from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("evaluation_offre", "0008_evaluationseanceassignation"),
    ]

    operations = [
        migrations.AddField(
            model_name="evaluationseanceassignation",
            name="heure_evaluation",
            field=models.TimeField(blank=True, null=True),
        ),
    ]
