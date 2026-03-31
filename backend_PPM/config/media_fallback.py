from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.http import Http404, HttpResponse
from django.views.static import serve as static_serve


def serve_tdr_st_media(request, path: str) -> HttpResponse:
    """
    Development-only fallback:
    - Primary: MEDIA_ROOT/tdr_st/<path> (current default)
    - Legacy:  BASE_DIR/tdr_st/<path>  (older deployments)
    """

    primary_root = Path(settings.MEDIA_ROOT) / "tdr_st"
    legacy_root = Path(settings.BASE_DIR) / "tdr_st"

    try:
        return static_serve(request, path, document_root=str(primary_root))
    except Http404:
        return static_serve(request, path, document_root=str(legacy_root))

