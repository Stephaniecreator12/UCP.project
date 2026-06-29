from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("achats", "0010_alter_demandeachat_source_financement"),
    ]

    operations = [
        migrations.AddField(
            model_name="demandeachat",
            name="email_fournisseur",
            field=models.EmailField(blank=True, max_length=254),
        ),
    ]
