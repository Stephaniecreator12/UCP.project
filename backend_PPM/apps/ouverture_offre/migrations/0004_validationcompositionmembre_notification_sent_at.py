from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ouverture_offre", "0003_composition_validation_and_offre_scelle"),
    ]

    operations = [
        migrations.AddField(
            model_name="validationcompositionmembre",
            name="notification_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
