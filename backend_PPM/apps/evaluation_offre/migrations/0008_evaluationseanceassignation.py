from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("ouverture_offre", "0012_offreouverture_lot_numero_offreouverture_nif_stat"),
        ("evaluation_offre", "0007_evaluationconclusion"),
    ]

    operations = [
        migrations.CreateModel(
            name="EvaluationSeanceAssignation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("evaluateur_nom_prenom", models.CharField(blank=True, max_length=255)),
                ("evaluateur_email", models.EmailField(blank=True, max_length=254)),
                ("evaluateur_entite", models.CharField(blank=True, max_length=255)),
                ("evaluateur_poste", models.CharField(blank=True, max_length=255)),
                ("evaluateur_numero_carte", models.CharField(blank=True, max_length=50)),
                ("date_evaluation", models.DateField(blank=True, null=True)),
                ("evaluation_password_hash", models.CharField(blank=True, max_length=128)),
                ("evaluation_password_generated_at", models.DateTimeField(blank=True, null=True)),
                ("evaluation_password_revoked_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "assigned_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="evaluation_seances_assignees",
                        to="auth.user",
                    ),
                ),
                (
                    "evaluateur",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="evaluation_seance_assignations",
                        to="auth.user",
                    ),
                ),
                (
                    "seance",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="evaluation_assignations",
                        to="ouverture_offre.seanceouverture",
                    ),
                ),
            ],
            options={
                "ordering": ["seance", "evaluateur"],
                "unique_together": {("seance", "evaluateur")},
            },
        ),
    ]
