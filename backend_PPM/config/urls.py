# routeur principal de Django.

from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

from config.media_fallback import serve_tdr_st_media
from apps.users.views.public_view import PublicLoginView
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/public/login/", PublicLoginView.as_view(), name="public_login"),
    path("api/ppm/", include("apps.ppm.urls")),
    path("api/users/", include("apps.users.urls")),
    path("api/TdrSt/", include("apps.TdrSt.urls")),
    

    #path("URL", fonction_qui_repond, name="nom")
    path("api/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),#login → créer un token
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),#refresh → renouveler le token
]

# Servir les fichiers uploadés (PDF) en développement uniquement
if settings.DEBUG:
    urlpatterns.insert(0, re_path(r"^media/tdr_st/(?P<path>.*)$", serve_tdr_st_media))
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
