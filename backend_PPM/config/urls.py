# routeur principal de Django.

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

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
    # Current login uses the stock JWT endpoint.
    # If one day access must be enforced by email domain on the backend
    # (for example allow "@ucp" here and reject others), this is the route
    # to replace with a custom login view instead of TokenObtainPairView.
    path("api/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
