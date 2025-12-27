"""
URL configuration for AliceTant application.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views.auth_views import SignupView, LoginView, CurrentUserView
from .views.appointment_views import AppointmentListView, ProviderAppointmentListView, AppointmentCancelView
from .views.profile_views import EmailUpdateView, PasswordUpdateView, AvatarUpdateView
from .views.business_views import BusinessViewSet
from .views.availability_views import AvailabilityListView, AvailabilityDetailView

# Create router for ViewSets
router = DefaultRouter()
router.register(r'businesses', BusinessViewSet, basename='business')

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    path('appointments/', AppointmentListView.as_view(), name='appointments'),
    path('appointments/provider/', ProviderAppointmentListView.as_view(), name='provider_appointments'),
    path('appointments/<int:appointment_id>/cancel/', AppointmentCancelView.as_view(), name='appointment_cancel'),
    path('profile/email/', EmailUpdateView.as_view(), name='profile_email'),
    path('profile/password/', PasswordUpdateView.as_view(), name='profile_password'),
    path('profile/avatar/', AvatarUpdateView.as_view(), name='profile_avatar'),
    path('availability/', AvailabilityListView.as_view(), name='availability_list'),
    path('availability/<int:availability_id>/', AvailabilityDetailView.as_view(), name='availability_detail'),
    
    # Include router URLs
    path('', include(router.urls)),
]
