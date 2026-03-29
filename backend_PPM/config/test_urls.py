from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", include("apps.users.urls")),
    path("api/achats/", include("apps.achats.urls")),
    path("api/Biens/", include("apps.ppm.urls")),
    path("api/Travaux/", include("apps.ppm.urls")),
    path("api/Consultance/", include("apps.ppm.urls")),
]
