from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ("ouverture_offre", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="seanceouverture",
            name="membres_verrouilles",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="seanceouverture",
            name="date_soumission_membres",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="seanceouverture",
            name="statut",
            field=models.CharField(
                choices=[
                    ("BROUILLON", "Brouillon"),
                    ("EN_SAISIE", "En saisie"),
                    ("EN_VALIDATION_MEMBRES", "En validation composition membres"),
                    ("MEMBRES_CONFIRMES", "Membres confirmes"),
                    ("EN_VALIDATION_PRESIDENT", "En validation president"),
                    ("VALIDEE", "Validee"),
                    ("REJETEE", "Rejetee"),
                ],
                db_index=True,
                default="BROUILLON",
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="offreouverture",
            name="consensus_technique_valide",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="offreouverture",
            name="description_rature",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="offreouverture",
            name="document_substitution_present",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="offreouverture",
            name="eliminee_examen",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="offreouverture",
            name="etat_scelle",
            field=models.CharField(
                blank=True,
                choices=[
                    ("INTACT", "Intact"),
                    ("ALTERE", "Altere"),
                    ("ABSENT", "Absent"),
                ],
                default="",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="offreouverture",
            name="presence_rature",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="ValidationCompositionMembre",
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
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("CN", "Coordinateur National"),
                            ("GP", "Gestionnaire Programme"),
                            ("RPM", "Responsable Programme"),
                        ],
                        max_length=8,
                    ),
                ),
                (
                    "decision",
                    models.CharField(
                        choices=[
                            ("EN_ATTENTE", "En attente"),
                            ("VALIDEE", "Validee"),
                            ("REJETEE", "Rejetee"),
                        ],
                        default="EN_ATTENTE",
                        max_length=20,
                    ),
                ),
                ("commentaire", models.TextField(blank=True)),
                ("date_validation", models.DateTimeField(blank=True, null=True)),
                (
                    "seance",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="validations_composition",
                        to="ouverture_offre.seanceouverture",
                    ),
                ),
                (
                    "validateur",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="validations_composition_membres",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["seance_id", "role"],
            },
        ),
        migrations.AddConstraint(
            model_name="validationcompositionmembre",
            constraint=models.UniqueConstraint(
                fields=("seance", "role"),
                name="unique_composition_role_par_seance",
            ),
        ),
    ]
