# Generated for evaluation evaluator identity snapshots.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("evaluation_offre", "0002_alter_audittrail_id_alter_decisionfinale_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="evaluationoffre",
            name="evaluateur_nom_prenom",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="evaluationoffre",
            name="evaluateur_email",
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name="evaluationoffre",
            name="evaluateur_entite",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="evaluationoffre",
            name="evaluateur_poste",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="evaluationoffre",
            name="evaluateur_numero_carte",
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
