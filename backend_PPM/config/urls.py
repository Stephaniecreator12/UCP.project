# routeur principal de Django.

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from apps.procurement.views.procurement_market_view import(
    DownloadDAOView
)
from apps.users.views.auth_view import (
    verifier_email_view,inscription_view,renvoyer_email_view
)
from apps.users.views.user_view import (
    me,get_user_profile_by_email,public_login,create_user
)
from config.media_fallback import serve_tdr_st_media
from apps.log.views.track_action_view import TrackActionView
from apps.log.views.view_count_view import ProcurementViewCountAPIView
from apps.log.views.annexe_ratio_view import AnnexeDownloadRatioAPIView
from apps.log.views.download_count_view import DAODownloadCountAPIView
from apps.log.views.individual_traceability_view import IndividualTraceabilityAPIView
from apps.log.views.operational_monitoring_view import OperationalMonitoringAPIView
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def home_view(request):
    return JsonResponse({
        "status": "online",
        "message": "UCP Backend API is running successfully!",
        "admin_panel": "/admin/",
        "project": "e-Proc UCP"
    })

urlpatterns = [
    path("", home_view, name="home"),
    path("admin/", admin.site.urls),
    path("api/login/", public_login, name="public_login"),
    path("api/ppm/", include("apps.ppm.urls")),
    path('api/public-profile/create/', inscription_view, name='api_register'),
    path('api/me/', me, name="user_profile"),
    path('api/user/create', me, name="user_profile_register"),
    path('api/user/', get_user_profile_by_email, name="user"),
    path("api/users/", include("apps.users.urls")),
    path("api/TdrSt/", include("apps.TdrSt.urls")),
    path('api/logs/dao-downloads/', DAODownloadCountAPIView.as_view(), name='dao-downloads-count'),
    path('api/logs/annexes-ratios/', AnnexeDownloadRatioAPIView.as_view(), name='annexes-download-ratios'),
    path('api/logs/views-count/', ProcurementViewCountAPIView.as_view(), name='procurement-views-count'),
    path('api/logs/monitoring/', OperationalMonitoringAPIView.as_view(), name='operational-monitoring'),
    path("api/logs/track", TrackActionView.as_view(), name="track-action"),
    path("api/logs/individual/", IndividualTraceabilityAPIView.as_view(), name="individual-traceability"),
    path('api/procurement/', include('apps.procurement.urls')),
    path('api/contrats/', include('apps.contrats.urls')),
    path('market/<path:reference_number>/download-dao/', DownloadDAOView.as_view(), name='download-dao'),    
    path('api/auth/verify-email/', verifier_email_view, name='api_verify_email'),
    path('api/auth/resend-email/', renvoyer_email_view, name='api_resend_email'),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),#refresh → renouveler le token
    path("api/achats/", include("apps.achats.urls")),
    path("api/ouverture/", include("apps.ouverture_offre.urls")),
    path("api/evaluation/", include("apps.evaluation_offre.urls"))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
