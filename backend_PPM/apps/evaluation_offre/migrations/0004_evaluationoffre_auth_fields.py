# Generated migration for authentication fields on EvaluationOffre

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("evaluation_offre", "0003_evaluationoffre_evaluateur_identite"),
    ]

    operations = [
        migrations.AddField(
            model_name="evaluationoffre",
            name="evaluation_password_hash",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name="evaluationoffre",
            name="evaluation_password_generated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="evaluationoffre",
            name="evaluation_password_consumed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
