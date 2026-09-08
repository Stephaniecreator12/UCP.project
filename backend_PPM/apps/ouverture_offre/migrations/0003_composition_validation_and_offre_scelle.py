from django.conf import settings
from django.db import migrations, models
from django.db.migrations.operations import SeparateDatabaseAndState
import django.db.models.deletion
import apps.ouverture_offre.models.membre_seance
import apps.ouverture_offre.models.offre_ouverture
import apps.ouverture_offre.models.seance_ouverture


class Migration(migrations.Migration):

    dependencies = [
        ("ouverture_offre", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # =====================================================================
        # STATE-ONLY ops: fields/columns already exist in the DB from the old
        # develop migrations (0003 + 0004) that were removed during merge.
        # These sync Django's migration state so makemigrations won't try to
        # recreate them.
        # =====================================================================

        # Old develop 0003 added category_type
        SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name="seanceouverture",
                    name="category_type",
                    field=models.CharField(
                        blank=True,
                        choices=apps.ouverture_offre.models.seance_ouverture._category_type_choices,
                        db_index=True,
                        default="",
                        help_text="Catégorie d'achat du dossier (BIENS / SERVICES / INFRA). Résolu automatiquement ou saisi manuellement.",
                        max_length=20,
                    ),
                ),
            ],
            database_operations=[],
        ),

        # Old develop 0004 altered these fields to use model-callable choices
        SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name="membreseance",
                    name="decision",
                    field=models.CharField(
                        choices=apps.ouverture_offre.models.membre_seance._decision_membre_seance_choices,
                        default="EN_ATTENTE",
                        max_length=20,
                    ),
                ),
            ],
            database_operations=[],
        ),
        SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name="offreouverture",
                    name="enveloppe_administrative",
                    field=models.CharField(
                        blank=True,
                        choices=apps.ouverture_offre.models.offre_ouverture._etat_enveloppe_choices,
                        default="",
                        max_length=20,
                    ),
                ),
                migrations.AlterField(
                    model_name="offreouverture",
                    name="enveloppe_financiere",
                    field=models.CharField(
                        blank=True,
                        choices=apps.ouverture_offre.models.offre_ouverture._etat_enveloppe_choices,
                        default="",
                        max_length=20,
                    ),
                ),
                migrations.AlterField(
                    model_name="offreouverture",
                    name="enveloppe_technique",
                    field=models.CharField(
                        blank=True,
                        choices=apps.ouverture_offre.models.offre_ouverture._etat_enveloppe_choices,
                        default="",
                        max_length=20,
                    ),
                ),
            ],
            database_operations=[],
        ),
        SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name="seanceouverture",
                    name="category_type",
                    field=models.CharField(
                        blank=True,
                        choices=apps.ouverture_offre.models.seance_ouverture._category_type_choices,
                        db_index=True,
                        default="",
                        help_text="Catégorie d'achat du dossier (BIENS / SERVICES / INFRA). Résolu automatiquement ou saisi manuellement.",
                        max_length=20,
                    ),
                ),
                migrations.AlterField(
                    model_name="seanceouverture",
                    name="etape_ouverture",
                    field=models.CharField(
                        choices=apps.ouverture_offre.models.seance_ouverture._etape_ouverture_choices,
                        default="COMPLETE",
                        max_length=20,
                    ),
                ),
                migrations.AlterField(
                    model_name="seanceouverture",
                    name="etat_scelle",
                    field=models.CharField(
                        blank=True,
                        choices=apps.ouverture_offre.models.seance_ouverture._etat_scelle_choices,
                        default="",
                        max_length=20,
                    ),
                ),
                migrations.AlterField(
                    model_name="seanceouverture",
                    name="president_decision",
                    field=models.CharField(
                        choices=apps.ouverture_offre.models.seance_ouverture._decision_seance_choices,
                        default="EN_ATTENTE",
                        max_length=20,
                    ),
                ),
            ],
            database_operations=[],
        ),

        # =====================================================================
        # REAL DATABASE OPERATIONS: new fields/tables from Stephanie's branch
        # =====================================================================

        # -- seanceouverture: new fields --
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
        # -- seanceouverture: alter statut to include MEMBRES_CONFIRMES --
        migrations.AlterField(
            model_name="seanceouverture",
            name="statut",
            field=models.CharField(
                choices=apps.ouverture_offre.models.seance_ouverture._statut_seance_choices,
                db_index=True,
                default="BROUILLON",
                max_length=32,
            ),
        ),
        # -- offreouverture: new fields --
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
        # -- Create ValidationCompositionMembre model --
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
                            ("CN", "Coordonnateur National"),
                            ("GP", "Gestionnaire de Programme"),
                            ("RPM", "Responsable Passation de Marché"),
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
                ("notification_sent_at", models.DateTimeField(blank=True, null=True)),
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
