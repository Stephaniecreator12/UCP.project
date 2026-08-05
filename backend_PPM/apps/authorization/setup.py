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
    return group, created


def setup_all_groups():
    results = {"created": 0, "updated": 0, "deleted": 0, "errors": 0}
    configured_names = {d["name"] for d in GROUP_DEFINITIONS}

    for definition in GROUP_DEFINITIONS:
        try:
            group, created = create_group(definition)
            if created:
                results["created"] += 1
            else:
                results["updated"] += 1
        except Exception as e:
            logger.error("Erreur lors de la création du groupe '%s': %s", definition["name"], e)
            results["errors"] += 1

    stale_groups = Group.objects.exclude(name__in=configured_names)
    stale_count = stale_groups.count()
    if stale_count:
        stale_names = list(stale_groups.values_list("name", flat=True))
        stale_groups.delete()
        results["deleted"] = stale_count
        logger.info(
            "Suppression de %d groupe(s) obsolète(s) : %s",
            stale_count,
            ", ".join(stale_names),
        )

    logger.info(
        "Configuration terminée : %d créés, %d mis à jour, %d supprimés, %d erreurs",
        results["created"],
        results["updated"],
        results["deleted"],
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
