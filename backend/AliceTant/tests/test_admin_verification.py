import sqlite3
import tempfile
from datetime import date, time, timedelta
from pathlib import Path
from types import SimpleNamespace

from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from AliceTant.exceptions.user_exceptions import InvalidAppointmentDataError, UnauthorizedAccessError
from AliceTant.models import Appointment, AppointmentCustomer, AppointmentStatus, AuditLog, Business, LoginEvent, User, UserRole
from AliceTant.repositories.appointment_repository import AppointmentRepository
from AliceTant.repositories.audit_log_repository import AuditLogRepository
from AliceTant.repositories.business_repository import BusinessRepository
from AliceTant.repositories.system_setting_repository import SystemSettingRepository
from AliceTant.repositories.user_repository import UserRepository
from AliceTant.services.admin_analytics_service import AdminAnalyticsService
from AliceTant.services.admin_appointment_service import AdminAppointmentService
from AliceTant.services.admin_business_service import AdminBusinessService
from AliceTant.services.admin_user_service import AdminUserService
from AliceTant.services.auth_service import AuthService
from AliceTant.services.appointment_service import AppointmentService
from AliceTant.services.backup_service import BackupService
from AliceTant.serializers.availability_serializers import AvailabilityCreateSerializer


class AdminVerificationBase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='adminverify',
            email='admin.verify@example.com',
            password='AdminPass123',
            role=UserRole.ADMIN,
            is_staff=True,
        )
        self.customer = AuthService.register_user(
            full_name='Customer Verify',
            email='customer.verify@example.com',
            password='CustomerPass123',
            role='customer',
        )
        self.provider = AuthService.register_user(
            full_name='Provider Verify',
            email='provider.verify@example.com',
            password='ProviderPass123',
            role='provider',
        )
        self.business = Business.objects.create(
            provider=self.provider.provider_profile,
            name='Verification Studio',
            summary='Admin verification business',
            phone='1234567890',
            email='studio@example.com',
            address='123 Verification Lane',
        )
        self.appointment = Appointment.objects.create(
            business=self.business,
            appointment_date=date.today() + timedelta(days=3),
            appointment_time=time(10, 0),
            end_time=time(11, 0),
            status=AppointmentStatus.ACTIVE,
            notes='Verification appointment',
        )
        AppointmentCustomer.objects.create(
            appointment=self.appointment,
            customer=self.customer.customer_profile,
        )
        AuditLogRepository.log_login_event(self.customer, success=True)
        AuditLogRepository.log_action(self.admin, 'VERIFY_ADMIN', AuditLog.TargetType.SYSTEM)


class AdminRepositoryVerificationTests(AdminVerificationBase):
    def test_user_repository_admin_methods(self):
        users = UserRepository.list_all_users({'role': UserRole.CUSTOMER})
        self.assertEqual(users.count(), 1)

        search_results = UserRepository.search_users('customer.verify')
        self.assertEqual(search_results.count(), 1)

        suspended_user = UserRepository.suspend_user(self.customer.id, 'Testing')
        self.assertTrue(suspended_user.is_suspended)

        reactivated_user = UserRepository.reactivate_user(self.customer.id)
        self.assertFalse(reactivated_user.is_suspended)

        reset_user = UserRepository.force_password_reset(self.customer.id)
        self.assertTrue(reset_user.must_change_password)

    def test_business_repository_admin_methods(self):
        businesses = BusinessRepository.list_admin_businesses(query='Verification')
        self.assertEqual(businesses.count(), 1)

        hidden_business = BusinessRepository.hide_business(self.business.id, 'Testing hide')
        self.assertTrue(hidden_business.is_hidden)
        self.assertEqual(hidden_business.hidden_reason, 'Testing hide')

        filtered_hidden = BusinessRepository.list_admin_businesses(is_hidden=True)
        self.assertEqual(filtered_hidden.count(), 1)

        visible_business = BusinessRepository.unhide_business(self.business.id)
        self.assertFalse(visible_business.is_hidden)

    def test_hidden_business_is_excluded_from_public_search_but_visible_to_admin(self):
        BusinessRepository.hide_business(self.business.id, 'Public hide verification')

        public_results = BusinessRepository.search_businesses('Verification')
        admin_results = BusinessRepository.list_admin_businesses(query='Verification')

        self.assertEqual(len(public_results), 0)
        self.assertEqual(admin_results.count(), 1)

    def test_appointment_repository_admin_methods(self):
        appointments = AppointmentRepository.list_all_for_admin(
            {
                'business_id': self.business.id,
                'customer_id': self.customer.id,
                'status': AppointmentStatus.ACTIVE,
                'start_date': date.today(),
                'end_date': date.today() + timedelta(days=7),
                'query': 'Verification',
            }
        )
        self.assertEqual(appointments.count(), 1)

        active_count = AppointmentRepository.count_customer_active_for_date(
            self.customer.id,
            self.appointment.appointment_date,
        )
        self.assertEqual(active_count, 1)

    def test_audit_and_setting_repositories(self):
        action = AuditLogRepository.log_action(
            self.admin,
            'VERIFY_REPOSITORY',
            AuditLog.TargetType.USER,
            self.customer.id,
            {'source': 'test'},
        )
        self.assertEqual(action.action, 'VERIFY_REPOSITORY')

        logs = AuditLogRepository.list_logs({'action': 'VERIFY_'})
        self.assertGreaterEqual(logs.count(), 2)

        login_event = AuditLogRepository.log_login_event(self.customer, success=False)
        self.assertFalse(login_event.success)

        login_history = AuditLogRepository.get_login_history(self.customer.id)
        self.assertGreaterEqual(login_history.count(), 2)

        setting = SystemSettingRepository.set(
            'announcement_banner_text',
            'Repository verification message',
            user=self.admin,
            description='Verification setting',
        )
        self.assertEqual(setting.key, 'announcement_banner_text')
        self.assertEqual(
            SystemSettingRepository.get('announcement_banner_text'),
            'Repository verification message',
        )
        self.assertTrue(SystemSettingRepository.all_settings().exists())


class AdminServiceAuthorizationVerificationTests(AdminVerificationBase):
    def test_non_admin_service_calls_are_rejected(self):
        checks = [
            lambda: AdminUserService.list_users(self.customer),
            lambda: AdminBusinessService.list_businesses(self.customer),
            lambda: AdminAppointmentService.list_appointments(self.customer),
            lambda: AdminAnalyticsService.user_growth(self.customer),
        ]

        for check in checks:
            with self.subTest(check=check):
                with self.assertRaises(UnauthorizedAccessError):
                    check()


class AdminSettingsEnforcementVerificationTests(AdminVerificationBase):
    def test_max_recurring_weeks_setting_blocks_long_recurring_slots(self):
        SystemSettingRepository.set('max_recurring_weeks', 4, user=self.admin)
        serializer = AvailabilityCreateSerializer(
            data={
                'business_id': self.business.id,
                'slots': [
                    {
                        'date': (date.today() + timedelta(days=1)).isoformat(),
                        'start_time': '09:00',
                        'end_time': '10:00',
                        'is_recurring': True,
                        'num_weeks': 8,
                    }
                ],
            },
            context={'request': SimpleNamespace(user=self.provider)},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('num_weeks must be between 1 and 4', str(serializer.errors))

    def test_max_bookings_per_customer_per_day_setting_blocks_extra_booking(self):
        SystemSettingRepository.set('max_bookings_per_customer_per_day', 1, user=self.admin)

        with self.assertRaises(InvalidAppointmentDataError):
            AppointmentService.book_appointment(
                business_id=self.business.id,
                customer_ids=[self.customer.id],
                appointment_date=self.appointment.appointment_date,
                appointment_time=time(12, 0),
                end_time=time(13, 0),
                notes='Should be blocked by daily limit',
            )

    def test_max_appointment_duration_setting_blocks_long_appointment(self):
        SystemSettingRepository.set('max_appointment_duration_minutes', 30, user=self.admin)

        with self.assertRaises(InvalidAppointmentDataError):
            AppointmentService.book_appointment(
                business_id=self.business.id,
                customer_ids=[self.customer.id],
                appointment_date=date.today() + timedelta(days=5),
                appointment_time=time(9, 0),
                end_time=time(10, 0),
                notes='Should be blocked by duration limit',
            )

    def test_suspended_user_receives_forbidden_on_protected_request(self):
        self.customer.is_suspended = True
        self.customer.save(update_fields=['is_suspended', 'updated_at'])

        token = AuthService.generate_jwt_token(self.customer)
        response = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AdminEndpointVerificationTests(AdminVerificationBase):
    def setUp(self):
        super().setUp()
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.base_dir = Path(self.temp_dir.name)
        (self.base_dir / 'db.sqlite3').write_bytes(b'admin-backup-verification')
        self.settings_override = override_settings(BASE_DIR=self.base_dir)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)

    def _requests(self, appointment_id=None):
        appointment_id = appointment_id or self.appointment.id
        return [
            ('get', '/api/admin/users/', None),
            ('post', f'/api/admin/users/{self.customer.id}/suspend/', {'reason': 'verify'}),
            ('post', f'/api/admin/users/{self.customer.id}/reactivate/', None),
            ('post', f'/api/admin/users/{self.customer.id}/force-password-reset/', None),
            ('get', f'/api/admin/users/{self.customer.id}/login-history/', None),
            ('get', '/api/admin/audit-log/', None),
            ('get', '/api/admin/businesses/', None),
            ('post', f'/api/admin/businesses/{self.business.id}/hide/', {'reason': 'verify'}),
            ('post', f'/api/admin/businesses/{self.business.id}/unhide/', None),
            ('get', '/api/admin/appointments/', None),
            ('post', f'/api/admin/appointments/{appointment_id}/force-cancel/', {'reason': 'verify'}),
            ('get', '/api/admin/analytics/users/', None),
            ('get', '/api/admin/analytics/bookings/', None),
            ('get', '/api/admin/analytics/cancellations/', None),
            ('get', '/api/admin/analytics/businesses/popularity/', None),
            ('get', '/api/admin/backups/', None),
            ('post', '/api/admin/backups/', None),
            ('get', '/api/admin/export/users.csv', None),
            ('get', '/api/admin/export/businesses.csv', None),
            ('get', '/api/admin/export/appointments.csv', None),
            ('get', '/api/admin/settings/', None),
            ('put', '/api/admin/settings/announcement_banner_text/', {'value': 'endpoint verify'}),
        ]

    def _call(self, method, path, payload=None):
        request_method = getattr(self.client, method)
        kwargs = {'format': 'json'} if payload is not None else {}
        return request_method(path, payload, **kwargs) if payload is not None else request_method(path)

    def test_all_admin_endpoints_require_authentication(self):
        for method, path, payload in self._requests():
            with self.subTest(method=method, path=path):
                response = self._call(method, path, payload)
                self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_all_admin_endpoints_reject_non_admin_roles(self):
        for user in (self.customer, self.provider):
            self.client.force_authenticate(user=user)
            for method, path, payload in self._requests():
                with self.subTest(user=user.role, method=method, path=path):
                    response = self._call(method, path, payload)
                    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
            self.client.force_authenticate(user=None)

    def test_all_admin_endpoints_allow_admin_and_backup_flows_work(self):
        self.client.force_authenticate(user=self.admin)

        for method, path, payload in self._requests():
            with self.subTest(method=method, path=path):
                response = self._call(method, path, payload)
                self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        backups_response = self.client.get('/api/admin/backups/')
        self.assertEqual(backups_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(backups_response.data['results']), 1)
        backup_filename = backups_response.data['results'][0]['filename']

        download_response = self.client.get(f'/api/admin/backups/{backup_filename}/download/')
        self.assertEqual(download_response.status_code, status.HTTP_200_OK)

        restore_response = self.client.post('/api/admin/backups/restore/', {'filename': backup_filename}, format='json')
        self.assertEqual(restore_response.status_code, status.HTTP_200_OK)

        delete_response = self.client.delete(f'/api/admin/backups/{backup_filename}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

        upload_file = self.base_dir / 'upload.sqlite3'
        upload_file.write_bytes(b'uploaded-backup')
        with upload_file.open('rb') as handle:
            upload_restore_response = self.client.post('/api/admin/backups/restore/', {'file': handle})
        self.assertEqual(upload_restore_response.status_code, status.HTTP_200_OK)


class AdminBackupPropertyVerificationTests(TestCase):
    def test_backup_restore_recovers_original_sqlite_data(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            base_dir = Path(temp_dir)
            db_path = base_dir / 'db.sqlite3'

            connection = sqlite3.connect(db_path)
            connection.execute('CREATE TABLE sample (id INTEGER PRIMARY KEY, value TEXT)')
            connection.execute('INSERT INTO sample (value) VALUES (?)', ('original',))
            connection.commit()
            connection.close()

            with override_settings(BASE_DIR=base_dir):
                backup = BackupService.create_backup()

                modified_connection = sqlite3.connect(db_path)
                modified_connection.execute('UPDATE sample SET value = ? WHERE id = 1', ('modified',))
                modified_connection.commit()
                modified_connection.close()

                BackupService.restore_backup(backup['filename'])

                restored_connection = sqlite3.connect(db_path)
                restored_value = restored_connection.execute('SELECT value FROM sample WHERE id = 1').fetchone()[0]
                restored_connection.close()

            self.assertEqual(restored_value, 'original')


class AdminSignupAndCommandVerificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_rejects_admin_role(self):
        response = self.client.post(
            '/api/auth/signup/',
            {
                'full_name': 'Should Fail',
                'email': 'no-admin@example.com',
                'password': 'StrongPass123',
                'role': 'admin',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('role', response.data.get('details', {}))

    def test_create_admin_command_creates_admin_user(self):
        call_command(
            'create_admin',
            email='command-admin@example.com',
            password='CommandPass123',
        )

        created_user = User.objects.get(email='command-admin@example.com')
        self.assertEqual(created_user.role, UserRole.ADMIN)
        self.assertTrue(created_user.is_staff)