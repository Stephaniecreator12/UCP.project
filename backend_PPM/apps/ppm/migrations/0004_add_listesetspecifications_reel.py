# Generated manually to persist the actual date used by the grid split cell.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ppm", "0003_rename_listesetspecifications_prevu_biens_listesetspecifications_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="biens",
            name="listesetspecifications_reel",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="travaux",
            name="listesetspecifications_reel",
            field=models.DateField(blank=True, null=True),
        ),
    ]
