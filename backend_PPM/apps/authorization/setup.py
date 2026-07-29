import logging
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q

from .config import GROUP_DEFINITIONS, CATEGORIES

logger = logging.getLogger(__name__)


def _get_permission_codenames(app_label, model_name, actions):
    return [f"{action}_{model_name}" for action in actions]


def _get_or_create_permissions(app_label, model_name, actions):
    content_type = ContentType.objects.filter(
        app_label=app_label,
        model=model_name,
    ).first()
    if not content_type:
        logger.warning(
            "ContentType introuvable pour %s.%s — modèle non migré ?",
            app_label,
            model_name,
        )
        return []

    codenames = _get_permission_codenames(app_label, model_name, actions)
    permissions = Permission.objects.filter(
        content_type=content_type,
        codename__in=codenames,
    )
    found = set(p.codename for p in permissions)
    missing = set(codenames) - found
    if missing:
        logger.warning(
            "Permissions manquantes pour %s.%s : %s",
            app_label,
            model_name,
            sorted(missing),
        )
    return list(permissions)


def create_group(definition):
    name = definition["name"]
    group, created = Group.objects.get_or_create(name=name)

    group.permissions.clear()

    permission_objects = []
    for app_label, models in definition.get("permissions", {}).items():
        for model_name, actions in models.items():
            perms = _get_or_create_permissions(app_label, model_name, actions)
            permission_objects.extend(perms)

    if permission_objects:
        group.permissions.add(*permission_objects)

    logger.info(
        "%s groupe '%s' avec %d permissions",
        "Créé" if created else "Mis à jour",
        name,
        len(permission_objects),
    )
    return group


def setup_all_groups():
    results = {"created": 0, "updated": 0, "errors": 0}
    for definition in GROUP_DEFINITIONS:
        try:
            create_group(definition)
            if Group.objects.filter(name=definition["name"]).exists():
                results["updated"] += 1
            else:
                results["created"] += 1
        except Exception as e:
            logger.error("Erreur lors de la création du groupe '%s': %s", definition["name"], e)
            results["errors"] += 1

    logger.info(
        "Configuration terminée : %d groupes à jour, %d erreurs",
        results["updated"],
        results["errors"],
    )
    return results


def list_missing_content_types():
    missing = []
    for definition in GROUP_DEFINITIONS:
        for app_label, models in definition.get("permissions", {}).items():
            for model_name in models:
                ct = ContentType.objects.filter(
                    app_label=app_label,
                    model=model_name,
                ).first()
                if not ct:
                    missing.append(f"{app_label}.{model_name}")
    return missing
