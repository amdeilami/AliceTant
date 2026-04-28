"""
URL configuration for AliceTant application.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views.auth_views import SignupView, LoginView, CurrentUserView
from .views.appointment_views import AppointmentViewSet, AppointmentListView, ProviderAppointmentListView, AppointmentCancelView
from .views.admin_user_views import (
    AdminUserListView,
    AdminUserSuspendView,
    AdminUserReactivateView,
    AdminUserForcePasswordResetView,
    AdminUserLoginHistoryView,
    AdminAuditLogView,
)
from .views.admin_business_views import AdminBusinessListView, AdminBusinessHideView, AdminBusinessUnhideView
from .views.admin_appointment_views import AdminAppointmentListView, AdminAppointmentForceCancelView
from .views.admin_analytics_views import (
    AdminUserAnalyticsView,
    AdminBookingAnalyticsView,
    AdminCancellationAnalyticsView,
    AdminBusinessPopularityAnalyticsView,
)
from .views.admin_backup_views import (
    AdminBackupListCreateView,
    AdminBackupDownloadView,
    AdminBackupRestoreView,
    AdminBackupDeleteView,
    AdminExportUsersView,
    AdminExportBusinessesView,
    AdminExportAppointmentsView,
)
from .views.admin_settings_views import AdminSettingListView, AdminSettingDetailView
from .views.announcement_views import AnnouncementView
from .views.profile_views import EmailUpdateView, PasswordUpdateView, AvatarUpdateView
from .views.business_views import BusinessViewSet
from .views.availability_views import AvailabilityListView, AvailabilityDetailView
from .views.working_hours_views import (
    WorkingHoursListView, WorkingHoursDetailView,
    BusinessClosureListView, BusinessClosureDetailView,
)

# Create router for ViewSets
router = DefaultRouter()
router.register(r'businesses', BusinessViewSet, basename='business')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    path('announcement/', AnnouncementView.as_view(), name='announcement'),

    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('admin/users/<int:user_id>/suspend/', AdminUserSuspendView.as_view(), name='admin_user_suspend'),
    path('admin/users/<int:user_id>/reactivate/', AdminUserReactivateView.as_view(), name='admin_user_reactivate'),
    path('admin/users/<int:user_id>/force-password-reset/', AdminUserForcePasswordResetView.as_view(), name='admin_user_force_password_reset'),
    path('admin/users/<int:user_id>/login-history/', AdminUserLoginHistoryView.as_view(), name='admin_user_login_history'),
    path('admin/audit-log/', AdminAuditLogView.as_view(), name='admin_audit_log'),
    path('admin/businesses/', AdminBusinessListView.as_view(), name='admin_businesses'),
    path('admin/businesses/<int:business_id>/hide/', AdminBusinessHideView.as_view(), name='admin_business_hide'),
    path('admin/businesses/<int:business_id>/unhide/', AdminBusinessUnhideView.as_view(), name='admin_business_unhide'),
    path('admin/appointments/', AdminAppointmentListView.as_view(), name='admin_appointments'),
    path('admin/appointments/<int:appointment_id>/force-cancel/', AdminAppointmentForceCancelView.as_view(), name='admin_appointment_force_cancel'),
    path('admin/analytics/users/', AdminUserAnalyticsView.as_view(), name='admin_analytics_users'),
    path('admin/analytics/bookings/', AdminBookingAnalyticsView.as_view(), name='admin_analytics_bookings'),
    path('admin/analytics/cancellations/', AdminCancellationAnalyticsView.as_view(), name='admin_analytics_cancellations'),
    path('admin/analytics/businesses/popularity/', AdminBusinessPopularityAnalyticsView.as_view(), name='admin_analytics_business_popularity'),
    path('admin/backups/', AdminBackupListCreateView.as_view(), name='admin_backups'),
    path('admin/backups/restore/', AdminBackupRestoreView.as_view(), name='admin_backups_restore'),
    path('admin/backups/<str:filename>/download/', AdminBackupDownloadView.as_view(), name='admin_backup_download'),
    path('admin/backups/<str:filename>/', AdminBackupDeleteView.as_view(), name='admin_backup_delete'),
    path('admin/export/users.csv', AdminExportUsersView.as_view(), name='admin_export_users'),
    path('admin/export/businesses.csv', AdminExportBusinessesView.as_view(), name='admin_export_businesses'),
    path('admin/export/appointments.csv', AdminExportAppointmentsView.as_view(), name='admin_export_appointments'),
    path('admin/settings/', AdminSettingListView.as_view(), name='admin_settings'),
    path('admin/settings/<str:key>/', AdminSettingDetailView.as_view(), name='admin_setting_detail'),
    
    # Legacy appointment endpoints (deprecated, use /appointments/ instead)
    path('appointments/legacy/', AppointmentListView.as_view({'get': 'list'}), name='appointments'),
    path('appointments/provider/legacy/', ProviderAppointmentListView.as_view({'get': 'list'}), name='provider_appointments'),
    path('appointments/<int:appointment_id>/cancel/legacy/', AppointmentCancelView.as_view({'post': 'cancel'}), name='appointment_cancel'),
    path('appointments/legacy/', AppointmentListView.as_view({'get': 'list'}), name='appointments_legacy'),
    path('appointments/provider/legacy/', ProviderAppointmentListView.as_view({'get': 'list'}), name='provider_appointments_legacy'),
    path('appointments/<int:appointment_id>/cancel/legacy/', AppointmentCancelView.as_view({'post': 'cancel'}), name='appointment_cancel_legacy'),
    
    path('profile/email/', EmailUpdateView.as_view(), name='profile_email'),
    path('profile/password/', PasswordUpdateView.as_view(), name='profile_password'),
    path('profile/avatar/', AvatarUpdateView.as_view(), name='profile_avatar'),
    path('availability/', AvailabilityListView.as_view(), name='availability_list'),
    path('availability/<int:availability_id>/', AvailabilityDetailView.as_view(), name='availability_detail'),
    path('working-hours/', WorkingHoursListView.as_view(), name='working_hours_list'),
    path('working-hours/<int:pk>/', WorkingHoursDetailView.as_view(), name='working_hours_detail'),
    path('closures/', BusinessClosureListView.as_view(), name='closure_list'),
    path('closures/<int:pk>/', BusinessClosureDetailView.as_view(), name='closure_detail'),
    
    # Include router URLs
    path('', include(router.urls)),
]
