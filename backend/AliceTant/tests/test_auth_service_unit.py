"""
Unit tests for AuthService.

Tests the core authentication service functionality including username generation,
JWT token creation, user registration, and authentication.
"""

from django.test import TestCase
from django.contrib.auth.hashers import check_password
from unittest.mock import patch, MagicMock
import jwt
from datetime import datetime, timedelta

from ..services.auth_service import AuthService
from ..models import User
from ..models.user import UserRole
from ..repositories.user_repository import UserRepository
from ..exceptions.user_exceptions import (
    UserNotFoundError,
    DuplicateUserError,
    InvalidUserDataError
)


class AuthServiceUsernameGenerationTest(TestCase):
    """Test username generation from email addresses."""
    
    def test_generate_username_from_simple_email(self):
        """Test username generation from a simple email address."""
        email = "john.doe@example.com"
        username = AuthService.generate_username(email)
        self.assertEqual(username, "john.doe")
    
    def test_generate_username_handles_duplicates(self):
        """Test that duplicate usernames get incremented numbers."""
        # Create a user with username 'testuser'
        User.objects.create_user(
            username='testuser',
            email='existing@example.com',
            password='testpass123',
            role=UserRole.CUSTOMER
        )
        
        # Generate username from email that would create 'testuser'
        email = "testuser@example.com"
        username = AuthService.generate_username(email)
        
        # Should append '1' to avoid duplicate
        self.assertEqual(username, "testuser1")
    
    def test_generate_username_invalid_email(self):
        """Test that invalid email raises InvalidUserDataError."""
        with self.assertRaises(InvalidUserDataError):
            AuthService.generate_username("not-an-email")


class AuthServiceJWTTokenTest(TestCase):
    """Test JWT token generation."""
    
    def setUp(self):
        """Create a test user for token generation."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role=UserRole.CUSTOMER
        )
    
    def test_generate_jwt_token_contains_user_data(self):
        """Test that JWT token contains correct user information."""
        token = AuthService.generate_jwt_token(self.user)
        
        # Decode token without verification for testing
        from django.conf import settings
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        # Verify payload contains user data
        self.assertEqual(payload['user_id'], self.user.id)
        self.assertEqual(payload['username'], self.user.username)
        self.assertEqual(payload['email'], self.user.email)
        self.assertEqual(payload['role'], self.user.role)
        self.assertIn('exp', payload)
        self.assertIn('iat', payload)


class AuthServiceRegistrationTest(TestCase):
    """Test user registration with profile creation."""
    
    def test_register_customer_creates_user_and_profile(self):
        """Test that registering a customer creates both user and customer profile."""
        user = AuthService.register_user(
            full_name="John Doe",
            email="john@example.com",
            password="SecurePass123",
            role="customer",
            phone_number="555-1234"
        )
        
        # Verify user was created
        self.assertIsNotNone(user)
        self.assertEqual(user.email, "john@example.com")
        self.assertEqual(user.role, UserRole.CUSTOMER)
        
        # Verify password was hashed
        self.assertTrue(check_password("SecurePass123", user.password))
        
        # Verify customer profile was created
        self.assertTrue(hasattr(user, 'customer_profile'))
        self.assertEqual(user.customer_profile.full_name, "John Doe")
    
    def test_register_provider_creates_user_and_profile(self):
        """Test that registering a provider creates both user and provider profile."""
        user = AuthService.register_user(
            full_name="Jane's Salon",
            email="jane@example.com",
            password="SecurePass123",
            role="provider"
        )
        
        # Verify user was created
        self.assertIsNotNone(user)
        self.assertEqual(user.email, "jane@example.com")
        self.assertEqual(user.role, UserRole.PROVIDER)
        
        # Verify provider profile was created
        self.assertTrue(hasattr(user, 'provider_profile'))
        self.assertEqual(user.provider_profile.business_name, "Jane's Salon")
    
    def test_register_user_with_duplicate_email_raises_error(self):
        """Test that registering with duplicate email raises DuplicateUserError."""
        # Create first user
        AuthService.register_user(
            full_name="John Doe",
            email="john@example.com",
            password="SecurePass123",
            role="customer"
        )
        
        # Attempt to create second user with same email
        with self.assertRaises(DuplicateUserError):
            AuthService.register_user(
                full_name="Jane Doe",
                email="john@example.com",
                password="AnotherPass123",
                role="customer"
            )
    
    def test_register_user_with_invalid_role_raises_error(self):
        """Test that registering with invalid role raises InvalidUserDataError."""
        with self.assertRaises(InvalidUserDataError):
            AuthService.register_user(
                full_name="John Doe",
                email="john@example.com",
                password="SecurePass123",
                role="invalid_role"
            )


class AuthServiceAuthenticationTest(TestCase):
    """Test user authentication."""
    
    def setUp(self):
        """Create a test user for authentication."""
        self.email = "test@example.com"
        self.password = "SecurePass123"
        self.user = AuthService.register_user(
            full_name="Test User",
            email=self.email,
            password=self.password,
            role="customer"
        )
    
    def test_authenticate_user_with_valid_credentials(self):
        """Test that valid credentials authenticate successfully."""
        authenticated_user = AuthService.authenticate_user(self.email, self.password)
        
        self.assertIsNotNone(authenticated_user)
        self.assertEqual(authenticated_user.id, self.user.id)
        self.assertEqual(authenticated_user.email, self.email)
    
    def test_authenticate_user_with_invalid_password(self):
        """Test that invalid password returns None."""
        authenticated_user = AuthService.authenticate_user(self.email, "WrongPassword")
        
        self.assertIsNone(authenticated_user)
    
    def test_authenticate_user_with_nonexistent_email(self):
        """Test that non-existent email returns None."""
        authenticated_user = AuthService.authenticate_user(
            "nonexistent@example.com",
            self.password
        )
        
        self.assertIsNone(authenticated_user)
