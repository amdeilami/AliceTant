"""
Unit tests for CurrentUserView API endpoint.

Tests the /api/auth/me/ endpoint for retrieving current authenticated user data.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from ..models.user import User
from ..services.auth_service import AuthService


class CurrentUserViewTest(TestCase):
    """Test suite for CurrentUserView endpoint."""
    
    def setUp(self):
        """Set up test client and create test user."""
        self.client = APIClient()
        
        # Create a test customer user
        self.user = AuthService.register_user(
            full_name="Test User",
            email="testuser@example.com",
            password="testpass123",
            role="customer"
        )
        
        # Generate JWT token for the user
        self.token = AuthService.generate_jwt_token(self.user)
    
    def test_get_current_user_with_valid_token(self):
        """Test that authenticated user can retrieve their data."""
        # Set authorization header with valid token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        # Make GET request to /api/auth/me/
        response = self.client.get('/api/auth/me/')
        
        # Assert response is successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Assert response contains user data
        self.assertEqual(response.data['email'], 'testuser@example.com')
        self.assertEqual(response.data['full_name'], 'Test User')
        self.assertEqual(response.data['role'], 'CUSTOMER')  # Role is stored as uppercase
        self.assertIn('id', response.data)
        self.assertIn('username', response.data)
        
        # Assert password is not included in response
        self.assertNotIn('password', response.data)
    
    def test_get_current_user_without_token(self):
        """Test that request without token is rejected."""
        # Make GET request without authorization header
        response = self.client.get('/api/auth/me/')
        
        # Assert response is unauthorized or forbidden (DRF returns 403 for missing auth)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_get_current_user_with_invalid_token(self):
        """Test that request with invalid token is rejected."""
        # Set authorization header with invalid token
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token_here')
        
        # Make GET request to /api/auth/me/
        response = self.client.get('/api/auth/me/')
        
        # Assert response is unauthorized or forbidden
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_get_current_user_with_malformed_header(self):
        """Test that request with malformed authorization header is rejected."""
        # Set malformed authorization header (missing 'Bearer' prefix)
        self.client.credentials(HTTP_AUTHORIZATION=self.token)
        
        # Make GET request to /api/auth/me/
        response = self.client.get('/api/auth/me/')
        
        # Assert response is unauthorized or forbidden
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
