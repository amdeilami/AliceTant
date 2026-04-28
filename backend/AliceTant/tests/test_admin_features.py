from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from AliceTant.models import LoginEvent, SystemSetting, User, UserRole
from AliceTant.services.auth_service import AuthService


class AdminUserEndpointsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='AdminPass123',
            role=UserRole.ADMIN,
        )
        self.customer = AuthService.register_user(
            full_name='Customer Example',
            email='customer@example.com',
            password='CustomerPass123',
            role='customer',
        )

    def test_admin_users_endpoint_requires_admin_role(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get('/api/admin/users/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_suspend_and_reactivate_user(self):
        self.client.force_authenticate(user=self.admin)

        suspend_response = self.client.post(
            f'/api/admin/users/{self.customer.id}/suspend/',
            {'reason': 'Policy violation'},
            format='json',
        )

        self.assertEqual(suspend_response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_suspended)
        self.assertEqual(self.customer.suspension_reason, 'Policy violation')

        reactivate_response = self.client.post(f'/api/admin/users/{self.customer.id}/reactivate/')

        self.assertEqual(reactivate_response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_suspended)


class AdminSettingsAndAnnouncementTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='adminsettings',
            email='admin.settings@example.com',
            password='AdminPass123',
            role=UserRole.ADMIN,
        )

    def test_default_system_settings_are_seeded(self):
        keys = set(SystemSetting.objects.values_list('key', flat=True))

        self.assertIn('max_bookings_per_customer_per_day', keys)
        self.assertIn('announcement_banner_text', keys)
        self.assertIn('announcement_banner_visible', keys)

    def test_admin_can_update_announcement_and_public_endpoint_reflects_it(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.put(
            '/api/admin/settings/announcement_banner_text/',
            {'value': 'Planned maintenance tonight'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.put(
            '/api/admin/settings/announcement_banner_visible/',
            {'value': True},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.put(
            '/api/admin/settings/announcement_banner_severity/',
            {'value': 'warning'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        public_response = self.client.get('/api/announcement/')

        self.assertEqual(public_response.status_code, status.HTTP_200_OK)
        self.assertEqual(public_response.data['text'], 'Planned maintenance tonight')
        self.assertTrue(public_response.data['visible'])
        self.assertEqual(public_response.data['severity'], 'warning')


class LoginEventLoggingTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AuthService.register_user(
            full_name='Login Example',
            email='login@example.com',
            password='LoginPass123',
            role='customer',
        )

    def test_successful_login_creates_success_event(self):
        response = self.client.post(
            '/api/auth/login/',
            {'email': 'login@example.com', 'password': 'LoginPass123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(LoginEvent.objects.filter(user=self.user, success=True).exists())

    def test_invalid_password_creates_failed_login_event(self):
        response = self.client.post(
            '/api/auth/login/',
            {'email': 'login@example.com', 'password': 'WrongPassword123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(LoginEvent.objects.filter(user=self.user, success=False).exists())

    def test_suspended_user_login_is_blocked_and_logged(self):
        self.user.is_suspended = True
        self.user.suspension_reason = 'Manual suspension'
        self.user.save(update_fields=['is_suspended', 'suspension_reason'])

        response = self.client.post(
            '/api/auth/login/',
            {'email': 'login@example.com', 'password': 'LoginPass123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(LoginEvent.objects.filter(user=self.user, success=False).exists())