"""
URL configuration for AliceTant application.
"""
from django.urls import path
from . import views
from .views.auth_views import SignupView, LoginView

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/login/', LoginView.as_view(), name='login'),
]
