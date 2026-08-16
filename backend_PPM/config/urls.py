# routeur principal de Django.

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views.auth_view import personnel_login_view

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/ppm/", include("apps.ppm.urls")),
    path("api/achats/", include("apps.achats.urls")),
    path("api/TdrSt/", include("apps.TdrSt.urls")),
    path("api/procurement/", include("apps.procurement.urls")),
    path("api/users/", include("apps.users.urls")),
    path("api/ouverture/", include("apps.ouverture_offre.urls")), 
    path("api/evaluation/", include("apps.evaluation_offre.urls")),
    path("api/", include("apps.contractualisation.urls")),
    path("api/login/", personnel_login_view, name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
