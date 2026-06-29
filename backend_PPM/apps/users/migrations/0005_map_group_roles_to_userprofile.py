from django.conf import settings
from django.db import migrations


ROLE_GROUPS = (
    ("AUDITEUR", "auditeur"),
    ("APPROBATEUR_NATIONAL", "approbateur_final"),
    ("VALIDATEUR_TECHNIQUE", "verificateur_technique"),
)


def map_roles_from_groups(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(app_label, model_name)
    UserProfile = apps.get_model("users", "UserProfile")

    for user in User.objects.all().iterator():
        profile, _ = UserProfile.objects.get_or_create(user=user)
        group_names = set(user.groups.values_list("name", flat=True))

        mapped_role = "demandeur"
        for group_name, role in ROLE_GROUPS:
            if group_name in group_names:
                mapped_role = role
                break

        if profile.role != mapped_role:
            profile.role = mapped_role
            profile.save(update_fields=["role"])


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0004_alter_userprofile_role"),
    ]

    operations = [
        migrations.RunPython(map_roles_from_groups, migrations.RunPython.noop),
    ]
