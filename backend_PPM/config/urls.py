# routeur principal de Django.

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/ppm/", include("apps.ppm.urls")),
    path("api/achats/", include("apps.achats.urls")),
    path("api/users/", include("apps.users.urls")),
    path("api/TdR_ST/", include("apps.TdR_ST.urls")),

    #path("URL", fonction_qui_repond, name="nom")
    path("api/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),#login → créer un token
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),#refresh → renouveler le token
]
