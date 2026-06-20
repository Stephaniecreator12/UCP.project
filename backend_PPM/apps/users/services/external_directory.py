from typing import Optional, Tuple

from django.db import connections

EXTERNAL_DB_ALIAS = "external_users"

# --- À ADAPTER selon le schéma réel de la base RH ---------------------
EXTERNAL_TOKEN_TABLE = "auth_tokens"
EXTERNAL_TOKEN_KEY_COLUMN = "key"
EXTERNAL_TOKEN_USER_FK_COLUMN = "user_id"

EXTERNAL_USER_TABLE = "users"
EXTERNAL_USER_ID_COLUMN = "id"
EXTERNAL_USER_NOM_COLUMN = "nom"
EXTERNAL_USER_PRENOM_COLUMN = "prenom"
# ------------------------------------------------------------------------

_RESOLVE_QUERY = f"""
    SELECT u.{EXTERNAL_USER_ID_COLUMN}, u.{EXTERNAL_USER_NOM_COLUMN}, u.{EXTERNAL_USER_PRENOM_COLUMN}
    FROM {EXTERNAL_TOKEN_TABLE} t
    JOIN {EXTERNAL_USER_TABLE} u ON u.{EXTERNAL_USER_ID_COLUMN} = t.{EXTERNAL_TOKEN_USER_FK_COLUMN}
    WHERE t.{EXTERNAL_TOKEN_KEY_COLUMN} = %s
"""


def resolve_external_identity(token: str) -> Tuple[Optional[str], str]:
    """
    Retourne (external_user_id, label_affiche) pour un jeton RH donné.
    Retourne (None, "") si le jeton est introuvable côté RH.
    """
    if not token:
        return None, ""

    with connections[EXTERNAL_DB_ALIAS].cursor() as cursor:
        cursor.execute(_RESOLVE_QUERY, [token])
        row = cursor.fetchone()

    if row is None:
        return None, ""

    user_id, nom, prenom = row
    label = f"{prenom} {nom}".strip() if prenom else (nom or "")
    return str(user_id), label


def get_external_identity_from_request(request) -> Tuple[Optional[str], str]:
    """
    Résout l'identité externe pour la requête courante, en mettant en
    cache le résultat sur l'objet `request` pour éviter une requête SQL
    par accès dans la même vue (ex: perform_create + audit).
    """
    user = getattr(request, "user", None)
    token = getattr(user, "token", None)

    if not token:
        return None, ""

    if not hasattr(request, "_external_identity_cache"):
        request._external_identity_cache = resolve_external_identity(token)

    return request._external_identity_cache