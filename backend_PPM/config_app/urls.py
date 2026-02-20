"""
URL configuration for marches project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from config_app.service import TravauxService, BiensService, ConsultanceService
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/Travaux/addTravaux/', TravauxService.insert_mock_travaux, name='api_add_travaux'),
    path('api/Travaux/listTravaux/', TravauxService.lister_travaux, name='api_list_travaux'),
    path('api/Travaux/deleteTravaux/<int:id>/', TravauxService.supprimer_travaux, name='api_delete_travaux'),
    path('api/Biens/addBiens/', BiensService.insert_mock_biens, name='api_add_biens'),
    path('api/Biens/listBiens/', BiensService.lister_biens, name='api_list_biens'),
    path('api/Biens/deleteBiens/<int:id>/', BiensService.supprimer_biens, name='api_delete_biens'),
    path('api/Consultance/addConsultance/', ConsultanceService.insert_mock_consultance, name='api_add_consultance'),
    path('api/Consultance/listConsultance/', ConsultanceService.lister_consultance, name='api_list_consultance'),
    path('api/Consultance/deleteConsultance/<int:id>/', ConsultanceService.supprimer_consultance, name='api_delete_consultance'),
    path('api/Consultance/calculerPlanningConsultance/', ConsultanceService.calculer_planning_consultance, name='api_calculer_planning'),
    path('api/Travaux/calculerPlanningTravaux/', TravauxService.calculer_planning_travaux, name='api_calculer_planning_travaux'),
    path('api/Biens/calculerPlanningBiens/', BiensService.calculer_planning_biens, name='api_calculer_planning_biens'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/Consultance/statutConsultance/', ConsultanceService.statut_consultance, name='api_statut_consultance'),
    path('api/Travaux/statutTravaux/', TravauxService.statut_travaux, name='api_statut_travaux'),
    path('api/Biens/statutBiens/', BiensService.statut_biens, name='api_statut_biens'),
]
