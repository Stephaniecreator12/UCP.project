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
from django.urls import path, include
from config_app.service.TravauxService import insert_mock_travaux, lister_travaux
from config_app.service.BiensService import insert_mock_biens, lister_biens
from django.contrib import admin
from config_app.service.ConsultanceService import insert_mock_consultance, lister_consultance
from config_app.service import TravauxService, BiensService, ConsultanceService
from config_app import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/Travaux/addTravaux/', TravauxService.insert_mock_travaux, name='api_add_travaux'),
    path('api/Travaux/listTravaux/', TravauxService.lister_travaux, name='api_list_travaux'),
    path('api/Biens/addBiens/', BiensService.insert_mock_biens, name='api_add_biens'),
    path('api/Biens/listBiens/', BiensService.lister_biens, name='api_list_biens'),
    path('api/Consultance/addConsultance/', ConsultanceService.insert_mock_consultance, name='api_add_consultance'),
    path('api/Consultance/listConsultance/', ConsultanceService.lister_consultance, name='api_list_consultance'),
    path('api/Consultance/calculerPlanningConsultance/', ConsultanceService.calculer_planning_consultance, name='api_calculer_planning'),
    path('api/Travaux/calculerPlanningTravaux/', TravauxService.calculer_planning_travaux),
    path('api/Biens/calculerPlanningBiens/', BiensService.calculer_planning_biens),
    path('api/login/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('api/Consultance/statutConsultance/', ConsultanceService.statut_consultance),
    path('api/Travaux/statutTravaux/', TravauxService.statut_travaux),
    path('api/Biens/statutBiens/', BiensService.statut_biens),
    path('api/Travaux/delete/<int:id>/', TravauxService.delete_travaux)
]