"""
Unit tests for appointment views.

Tests the appointment API endpoints including:
- Listing appointments for authenticated customers
- Listing appointments for authenticated providers
- Cancelling appointments
- Authorization requirements
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from AliceTant.models.user import User, UserRole


class AppointmentListViewTest(TestCase):
    """
    Test cases for the AppointmentListView endpoint.
    """
    
    def setUp(self):
        """
        Set up test client and create test user.
        """
        self.client = APIClient()
        
        # Create a test customer user
        self.customer_user = User.objects.create_user(
            username='testcustomer',
            email='customer@test.com',
            password='testpass123',
            role=UserRole.CUSTOMER
        )
        
    def test_appointments_requires_authentication(self):
        """
        Test that the appointments endpoint requires authentication.
        """
        url = reverse('appointments')
        response = self.client.get(url)
        
        # Should return 401 or 403 (DRF returns 403 for unauthenticated requests)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        
    def test_appointments_returns_list_for_authenticated_user(self):
        """
        Test that authenticated users can retrieve appointments list.
        """
        # Authenticate the client
        self.client.force_authenticate(user=self.customer_user)
        
        url = reverse('appointments')
        response = self.client.get(url)
        
        # Should return 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return a list
        self.assertIsInstance(response.data, list)
        
    def test_appointments_returns_mock_data(self):
        """
        Test that the endpoint returns mock appointment data.
        Currently returns mock data until Appointment model is implemented.
        """
        # Authenticate the client
        self.client.force_authenticate(user=self.customer_user)
        
        url = reverse('appointments')
        response = self.client.get(url)
        
        # Should return 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return mock appointments
        self.assertGreater(len(response.data), 0)
        
        # Check structure of first appointment
        first_appointment = response.data[0]
        self.assertIn('id', first_appointment)
        self.assertIn('date', first_appointment)
        self.assertIn('time', first_appointment)
        self.assertIn('providerName', first_appointment)
        self.assertIn('businessName', first_appointment)
        self.assertIn('status', first_appointment)


class ProviderAppointmentListViewTest(TestCase):
    """
    Test cases for the ProviderAppointmentListView endpoint.
    """
    
    def setUp(self):
        """
        Set up test client and create test users.
        """
        self.client = APIClient()
        
        # Create a test provider user
        self.provider_user = User.objects.create_user(
            username='testprovider',
            email='provider@test.com',
            password='testpass123',
            role=UserRole.PROVIDER
        )
        
        # Create a test customer user
        self.customer_user = User.objects.create_user(
            username='testcustomer',
            email='customer@test.com',
            password='testpass123',
            role=UserRole.CUSTOMER
        )
        
    def test_provider_appointments_requires_authentication(self):
        """
        Test that the provider appointments endpoint requires authentication.
        """
        url = reverse('provider_appointments')
        response = self.client.get(url)
        
        # Should return 401 or 403
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        
    def test_provider_appointments_requires_provider_role(self):
        """
        Test that only providers can access the provider appointments endpoint.
        """
        # Authenticate as customer
        self.client.force_authenticate(user=self.customer_user)
        
        url = reverse('provider_appointments')
        response = self.client.get(url)
        
        # Should return 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)
        
    def test_provider_appointments_returns_list_for_provider(self):
        """
        Test that authenticated providers can retrieve appointments list.
        """
        # Authenticate as provider
        self.client.force_authenticate(user=self.provider_user)
        
        url = reverse('provider_appointments')
        response = self.client.get(url)
        
        # Should return 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return a list
        self.assertIsInstance(response.data, list)
        
    def test_provider_appointments_returns_correct_structure(self):
        """
        Test that provider appointments have the correct data structure.
        """
        # Authenticate as provider
        self.client.force_authenticate(user=self.provider_user)
        
        url = reverse('provider_appointments')
        response = self.client.get(url)
        
        # Should return 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return mock appointments
        self.assertGreater(len(response.data), 0)
        
        # Check structure of first appointment
        first_appointment = response.data[0]
        self.assertIn('id', first_appointment)
        self.assertIn('customerName', first_appointment)
        self.assertIn('customerEmail', first_appointment)
        self.assertIn('businessName', first_appointment)
        self.assertIn('date', first_appointment)
        self.assertIn('time', first_appointment)
        self.assertIn('status', first_appointment)


class AppointmentCancelViewTest(TestCase):
    """
    Test cases for the AppointmentCancelView endpoint.
    """
    
    def setUp(self):
        """
        Set up test client and create test user.
        """
        self.client = APIClient()
        
        # Create a test provider user
        self.provider_user = User.objects.create_user(
            username='testprovider',
            email='provider@test.com',
            password='testpass123',
            role=UserRole.PROVIDER
        )
        
    def test_cancel_appointment_requires_authentication(self):
        """
        Test that the cancel appointment endpoint requires authentication.
        """
        url = reverse('appointment_cancel', kwargs={'appointment_id': 1})
        response = self.client.post(url)
        
        # Should return 401 or 403
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        
    def test_cancel_appointment_returns_success(self):
        """
        Test that authenticated users can cancel appointments.
        """
        # Authenticate the client
        self.client.force_authenticate(user=self.provider_user)
        
        url = reverse('appointment_cancel', kwargs={'appointment_id': 1})
        response = self.client.post(url)
        
        # Should return 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return cancelled status
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'cancelled')
