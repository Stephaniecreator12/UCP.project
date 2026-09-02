# routeur principal de Django.

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

admin.site.site_header = "UCP Admin"
admin.site.site_title = "UCP"
admin.site.index_title = "Administration"
from apps.procurement.views.procurement_market_view import(
    DownloadDAOView
)
from apps.users.views.auth_view import (
    verifier_email_view,renvoyer_email_view
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
from apps.ppm.views.dashboard_view import ppm_dashboard_view
from config.views import AdminLoginView

def home_view(request):
    return JsonResponse({
        "status": "online",
        "message": "UCP Backend API is running successfully!",
        "admin_panel": "/admin/",
        "project": "e-Proc UCP"
    })

urlpatterns = [
    path("", home_view, name="home"),
    path("admin/ppm-dashboard/", ppm_dashboard_view, name="ppm_dashboard"),
    path("admin/login/", AdminLoginView.as_view(), name="admin_login"),
    path("admin/", admin.site.urls),
    path("api/ppm/", include("apps.ppm.urls")),
    path("api/common/", include("apps.common.urls")),
    path("api/users/", include("apps.users.urls")),
    path("api/TdrSt/", include("apps.TdrSt.urls")),
    path("api/logs/", include("apps.log.urls")),
    path('api/procurement/', include('apps.procurement.urls')),
    path('api/contrats/', include('apps.contractualisation.urls')),
    path('market/<path:reference_number>/download-dao/', DownloadDAOView.as_view(), name='download-dao'),    
    path('api/auth/verify-email/', verifier_email_view, name='api_verify_email'),
    path('api/auth/resend-email/', renvoyer_email_view, name='api_resend_email'),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),#refresh → renouveler le token
    path("api/achats/", include("apps.achats.urls")),
    path("api/ouverture/", include("apps.ouverture_offre.urls")),
    path("api/evaluation/", include("apps.evaluation_offre.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += staticfiles_urlpatterns()
