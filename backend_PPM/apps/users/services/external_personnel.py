import json
from dataclasses import dataclass
from typing import Any
from urllib import error, request

from django.conf import settings


COLLECTION_KEYS = [
    "results",
    "data",
    "items",
    "personnels",
    "personnel",
    "users",
    "agents",
    "employees",
    "rows",
]


@dataclass
class ExternalPersonnelApiError(Exception):
    message: str
    status_code: int = 502
    detail: str = ""


def _read_string(record: dict[str, Any], keys: list[str]) -> str:
    for key in keys:
        value = record.get(key)

        if isinstance(value, str):
            trimmed = value.strip()
            if trimmed:
                return trimmed

        if isinstance(value, (int, float)):
            return str(value)

    return ""


def _pick_collection(payload: Any) -> list[Any]:
    if isinstance(payload, list):
        return payload

    if not isinstance(payload, dict):
        return []

    for key in COLLECTION_KEYS:
        value = payload.get(key)
        if isinstance(value, list):
            return value

    for value in payload.values():
        if isinstance(value, list):
            return value

        if isinstance(value, dict):
            for nested_value in value.values():
                if isinstance(nested_value, list):
                    return nested_value

    return []


def _build_label(record: dict[str, Any]) -> str:
    direct_name = _read_string(
        record,
        [
            "full_name",
            "fullName",
            "display_name",
            "displayName",
            "nom_complet",
            "name",
        ],
    )
    if direct_name:
        return direct_name

    nom = _read_string(record, ["nom", "last_name", "lastname", "surname"])
    prenom = _read_string(record, ["prenom", "first_name", "firstname", "given_name"])
    combined = " ".join(part for part in [nom, prenom] if part).strip()
    if combined:
        return combined

    return _read_string(
        record,
        [
            "username",
            "login",
            "email",
            "emailPersonnel",
            "matricule",
            "code",
        ],
    )


def _normalize_personnel_item(item: Any) -> dict[str, str] | None:
    if not isinstance(item, dict):
        return None

    label = _build_label(item)
    if not label:
        return None

    identifier = _read_string(
        item,
        [
            "id",
            "user_id",
            "personnel_id",
            "employee_id",
            "agent_id",
            "matricule",
            "uuid",
            "code",
        ],
    ) or label

    subtitle = _read_string(
        item,
        [
            "service",
            "service_actuel",
            "serviceActuel",
            "service_name",
            "department",
            "department_name",
            "unite",
            "unit",
            "direction",
            "fonction",
            "job_title",
            "email",
            "emailPersonnel",
        ],
    )

    normalized = {
        "id": identifier,
        "label": label,
    }

    if subtitle:
        normalized["subtitle"] = subtitle

    return normalized


def _sort_personnel_options(option: dict[str, str]) -> tuple[str, str]:
    return (
        option["label"].casefold(),
        option.get("subtitle", "").casefold(),
    )


def _get_upstream_url() -> str:
    return getattr(settings, "EXTERNAL_PERSONNEL_API_URL", "").strip()


def _build_headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}

    token = getattr(settings, "EXTERNAL_PERSONNEL_API_TOKEN", "").strip()
    if not token:
        return headers

    header_name = getattr(
        settings,
        "EXTERNAL_PERSONNEL_API_AUTH_HEADER",
        "Authorization",
    ).strip() or "Authorization"
    auth_scheme = getattr(
        settings,
        "EXTERNAL_PERSONNEL_API_AUTH_SCHEME",
        "Bearer",
    ).strip()

    headers[header_name] = f"{auth_scheme} {token}".strip()
    return headers


def _read_response_body(response: Any) -> str:
    charset = "utf-8"
    response_headers = getattr(response, "headers", None)
    if response_headers is not None:
        try:
            charset = response_headers.get_content_charset() or "utf-8"
        except AttributeError:
            charset = "utf-8"

    return response.read().decode(charset, errors="replace")


def fetch_external_personnel_directory() -> list[dict[str, str]]:
    upstream_url = _get_upstream_url()
    if not upstream_url:
        raise ExternalPersonnelApiError(
            "EXTERNAL_PERSONNEL_API_URL manquante.",
            status_code=503,
        )

    headers = _build_headers()
    timeout = getattr(settings, "EXTERNAL_PERSONNEL_API_TIMEOUT", 15)
    upstream_request = request.Request(
        upstream_url,
        headers=headers,
        method="GET",
    )

    try:
        with request.urlopen(upstream_request, timeout=timeout) as upstream_response:
            raw_body = _read_response_body(upstream_response)
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise ExternalPersonnelApiError(
            "La recuperation du personnel externe a echoue.",
            status_code=502,
            detail=detail or f"HTTP {exc.code}",
        ) from exc
    except error.URLError as exc:
        raise ExternalPersonnelApiError(
            "Serveur personnel externe indisponible.",
            status_code=502,
            detail=str(exc.reason),
        ) from exc

    try:
        payload = json.loads(raw_body) if raw_body else []
    except json.JSONDecodeError as exc:
        raise ExternalPersonnelApiError(
            "La reponse du serveur personnel n'est pas un JSON valide.",
            status_code=502,
            detail=raw_body[:500],
        ) from exc

    personnel = [
        option
        for option in (
            _normalize_personnel_item(item)
            for item in _pick_collection(payload)
        )
        if option is not None
    ]

    return sorted(personnel, key=_sort_personnel_options)
