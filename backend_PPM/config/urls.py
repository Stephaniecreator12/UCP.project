# routeur principal de Django.

from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from apps.procurement.views.procurement_market_view import(
    DownloadDAOView
)
from apps.users.views.auth_view import (
    verifier_email_view,inscription_view
)
from config.media_fallback import serve_tdr_st_media
from apps.users.views.public_view import PublicLoginView
from apps.log.views.track_action_view import TrackActionView
from apps.log.views.view_count_view import ProcurementViewCountAPIView
from apps.log.views.annexe_ratio_view import AnnexeDownloadRatioAPIView
from apps.log.views.download_count_view import DAODownloadCountAPIView
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/public/login/", PublicLoginView.as_view(), name="public_login"),
    path("api/ppm/", include("apps.ppm.urls")),
    path('api/users/create/', inscription_view, name='api_register'),
    path("api/users/", include("apps.users.urls")),
    path("api/TdrSt/", include("apps.TdrSt.urls")),
    path('api/logs/dao-downloads/', DAODownloadCountAPIView.as_view(), name='dao-downloads-count'),
    path('api/logs/annexes-ratios/', AnnexeDownloadRatioAPIView.as_view(), name='annexes-download-ratios'),
    path('api/logs/views-count/', ProcurementViewCountAPIView.as_view(), name='procurement-views-count'),
    path("api/logs/track", TrackActionView.as_view(), name="track-action"),
    path('api/procurement/', include('apps.procurement.urls')),
    path('market/<path:reference_number>/download-dao/', DownloadDAOView.as_view(), name='download-dao'),
    
    
    path('api/auth/verify-email/', verifier_email_view, name='api_verify_email'),
    #path("URL", fonction_qui_repond, name="nom")
    path("api/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),#login → créer un token
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),#refresh → renouveler le token
]

# Servir les fichiers uploadés (PDF) en développement uniquement
if settings.DEBUG:
    urlpatterns.insert(0, re_path(r"^media/tdr_st/(?P<path>.*)$", serve_tdr_st_media))
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
