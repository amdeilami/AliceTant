"""
Unit tests for SignupView API endpoint.

Tests the signup API view to ensure proper handling of valid requests,
validation errors, duplicate users, and error responses.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from AliceTant.models import User, Customer, Provider


class SignupViewTest(TestCase):
    """Test cases for SignupView API endpoint."""
    
    def setUp(self):
        """Set up test client and test data."""
        self.client = APIClient()
        self.signup_url = '/api/auth/signup/'
        
        self.valid_customer_data = {
            'full_name': 'John Doe',
            'email': 'john.doe@example.com',
            'phone_number': '555-1234',
            'password': 'SecurePass123',
            'role': 'customer'
        }
        
        self.valid_provider_data = {
            'full_name': 'Jane Smith Business',
            'email': 'jane.smith@example.com',
            'phone_number': '555-5678',
            'password': 'SecurePass456',
            'role': 'provider'
        }
    
    def test_signup_customer_success(self):
        """Test successful customer registration returns 201 with user data."""
        response = self.client.post(
            self.signup_url,
            self.valid_customer_data,
            format='json'
        )
        
        # Assert 201 Created status
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Assert response contains user data
        self.assertIn('id', response.data)
        self.assertIn('username', response.data)
        self.assertIn('email', response.data)
        self.assertIn('role', response.data)
        self.assertIn('full_name', response.data)
        self.assertIn('created_at', response.data)
        
        # Assert correct values
        self.assertEqual(response.data['email'], 'john.doe@example.com')
        self.assertEqual(response.data['role'], 'CUSTOMER')
        self.assertEqual(response.data['full_name'], 'John Doe')
        
        # Assert password is not in response
        self.assertNotIn('password', response.data)
        
        # Assert user was created in database
        user = User.objects.get(email='john.doe@example.com')
        self.assertIsNotNone(user)
        self.assertEqual(user.role, 'CUSTOMER')
        
        # Assert customer profile was created
        self.assertTrue(hasattr(user, 'customer_profile'))
        self.assertEqual(user.customer_profile.full_name, 'John Doe')
    
    def test_signup_provider_success(self):
        """Test successful provider registration returns 201 with user data."""
        response = self.client.post(
            self.signup_url,
            self.valid_provider_data,
            format='json'
        )
        
        # Assert 201 Created status
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Assert correct role
        self.assertEqual(response.data['role'], 'PROVIDER')
        
        # Assert user was created in database
        user = User.objects.get(email='jane.smith@example.com')
        self.assertEqual(user.role, 'PROVIDER')
        
        # Assert provider profile was created
        self.assertTrue(hasattr(user, 'provider_profile'))
        self.assertEqual(user.provider_profile.business_name, 'Jane Smith Business')
    
    def test_signup_with_missing_required_field_returns_400(self):
        """Test signup with missing required field returns 400."""
        invalid_data = self.valid_customer_data.copy()
        del invalid_data['email']
        
        response = self.client.post(
            self.signup_url,
            invalid_data,
            format='json'
        )
        
        # Assert 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Assert error message present
        self.assertIn('error', response.data)
    
    def test_signup_with_invalid_email_returns_400(self):
        """Test signup with invalid email format returns 400."""
        invalid_data = self.valid_customer_data.copy()
        invalid_data['email'] = 'not-an-email'
        
        response = self.client.post(
            self.signup_url,
            invalid_data,
            format='json'
        )
        
        # Assert 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_signup_with_weak_password_returns_400(self):
        """Test signup with weak password returns 400."""
        invalid_data = self.valid_customer_data.copy()
        invalid_data['password'] = 'weak'
        
        response = self.client.post(
            self.signup_url,
            invalid_data,
            format='json'
        )
        
        # Assert 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_signup_with_duplicate_email_returns_409(self):
        """Test signup with existing email returns 409 Conflict."""
        # Create first user
        self.client.post(
            self.signup_url,
            self.valid_customer_data,
            format='json'
        )
        
        # Try to create another user with same email
        duplicate_data = self.valid_customer_data.copy()
        duplicate_data['full_name'] = 'Different Name'
        
        response = self.client.post(
            self.signup_url,
            duplicate_data,
            format='json'
        )
        
        # Assert 409 Conflict
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('already exists', response.data['error'])
    
    def test_signup_with_invalid_role_returns_400(self):
        """Test signup with invalid role returns 400."""
        invalid_data = self.valid_customer_data.copy()
        invalid_data['role'] = 'invalid_role'
        
        response = self.client.post(
            self.signup_url,
            invalid_data,
            format='json'
        )
        
        # Assert 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_signup_without_phone_number_succeeds(self):
        """Test signup without phone number (optional field) succeeds."""
        data = self.valid_customer_data.copy()
        del data['phone_number']
        
        response = self.client.post(
            self.signup_url,
            data,
            format='json'
        )
        
        # Assert 201 Created
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_signup_response_excludes_password(self):
        """Test that signup response never includes password or password hash."""
        response = self.client.post(
            self.signup_url,
            self.valid_customer_data,
            format='json'
        )
        
        # Assert password not in response
        self.assertNotIn('password', response.data)
        
        # Convert response to string and check for password value
        response_str = str(response.data)
        self.assertNotIn('SecurePass123', response_str)
    
    def test_signup_stores_hashed_password(self):
        """Test that password is hashed in database, not stored as plain text."""
        response = self.client.post(
            self.signup_url,
            self.valid_customer_data,
            format='json'
        )
        
        # Get user from database
        user = User.objects.get(email='john.doe@example.com')
        
        # Assert password is hashed (not equal to plain text)
        self.assertNotEqual(user.password, 'SecurePass123')
        
        # Assert password hash starts with algorithm identifier
        self.assertTrue(user.password.startswith('pbkdf2_sha256$'))
