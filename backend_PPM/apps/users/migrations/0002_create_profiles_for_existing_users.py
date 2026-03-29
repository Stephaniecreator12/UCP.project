from django.conf import settings
from django.db import migrations


def create_profiles(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(app_label, model_name)
    UserProfile = apps.get_model("users", "UserProfile")

    for user in User.objects.all().iterator():
        UserProfile.objects.get_or_create(user=user)


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_profiles, migrations.RunPython.noop),
    ]

