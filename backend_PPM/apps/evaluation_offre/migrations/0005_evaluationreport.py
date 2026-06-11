# Generated migration for EvaluationReport model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("evaluation_offre", "0004_evaluationoffre_auth_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="EvaluationReport",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("fichier", models.FileField(upload_to="evaluation_reports/")),
                ("version", models.IntegerField(default=1)),
                ("hash_document", models.CharField(db_index=True, max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "decision",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="report",
                        to="evaluation_offre.decisionfinale",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
