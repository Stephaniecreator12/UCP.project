from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("evaluation_offre", "0006_alter_evaluationoffre_date_evaluation"),
    ]

    operations = [
        migrations.CreateModel(
            name="EvaluationConclusion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "recommandation",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("ATTRIBUER", "Attribuer le marché"),
                            ("REJETER", "Rejeter l'offre"),
                            ("RELANCER", "Relancer l'appel d'offres"),
                        ],
                        max_length=20,
                        null=True,
                    ),
                ),
                ("justification", models.TextField(blank=True)),
                (
                    "declaration_conflit",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("OUI", "Oui — aucun lien avec le soumissionnaire"),
                            ("NON", "Non — conflit d'intérêt déclaré"),
                        ],
                        max_length=3,
                    ),
                ),
                ("signe_le", models.DateTimeField(blank=True, null=True)),
                (
                    "evaluation",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conclusion",
                        to="evaluation_offre.evaluationoffre",
                    ),
                ),
            ],
        ),
    ]
