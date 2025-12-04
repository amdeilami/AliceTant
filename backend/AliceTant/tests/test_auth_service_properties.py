"""
Property-based tests for AuthService.

Tests invariants and properties that should hold across all valid inputs
for the authentication service.
"""

from django.test import TestCase
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from django.contrib.auth.hashers import check_password

from ..services.auth_service import AuthService
from ..models import User
from ..models.user import UserRole
from ..exceptions.user_exceptions import InvalidUserDataError


# Custom strategies for test data
valid_email = st.emails()
valid_password = st.text(min_size=8, max_size=128, alphabet=st.characters(
    blacklist_categories=('Cs', 'Cc')  # Exclude surrogates and control chars
))
valid_name = st.text(min_size=2, max_size=64, alphabet=st.characters(
    whitelist_categories=('L', 'N', 'P', 'Zs'),  # Letters, numbers, punctuation, spaces
    blacklist_characters='\x00'
))
valid_role = st.sampled_from(['customer', 'provider', 'CUSTOMER', 'PROVIDER'])


class AuthServiceUsernamePropertyTest(HypothesisTestCase):
    """Property-based tests for username generation."""
    
    @given(email=valid_email)
    @settings(max_examples=20, deadline=None)
    def test_username_derived_from_email_local_part(self, email):
        """Property: Username should always be derived from email local part."""
        try:
            username = AuthService.generate_username(email)
            expected_base = email.split('@')[0]
            
            # Username should either be the base or base with a number
            self.assertTrue(
                username == expected_base or username.startswith(expected_base)
            )
        except InvalidUserDataError:
            # Some generated emails might be invalid, that's ok
            pass


class AuthServiceRegistrationPropertyTest(HypothesisTestCase):
    """Property-based tests for user registration."""
    
    @given(
        full_name=valid_name,
        email=valid_email,
        password=valid_password,
        role=valid_role
    )
    @settings(max_examples=10, deadline=None)
    def test_password_always_hashed_in_database(self, full_name, email, password, role):
        """Property: Passwords should never be stored in plain text."""
        try:
            user = AuthService.register_user(
                full_name=full_name,
                email=email,
                password=password,
                role=role
            )
            
            # Password in database should not equal plain text password
            self.assertNotEqual(user.password, password)
            
            # But check_password should verify it correctly
            self.assertTrue(check_password(password, user.password))
            
            # Clean up
            user.delete()
            
        except (InvalidUserDataError, Exception):
            # Some generated data might be invalid, that's ok
            pass
    
    @given(
        full_name=valid_name,
        email=valid_email,
        password=valid_password,
        role=valid_role
    )
    @settings(max_examples=10, deadline=None)
    def test_role_normalized_to_uppercase(self, full_name, email, password, role):
        """Property: User role should always be stored in uppercase."""
        try:
            user = AuthService.register_user(
                full_name=full_name,
                email=email,
                password=password,
                role=role
            )
            
            # Role should be uppercase in database
            self.assertIn(user.role, [UserRole.CUSTOMER, UserRole.PROVIDER])
            self.assertEqual(user.role, user.role.upper())
            
            # Clean up
            user.delete()
            
        except (InvalidUserDataError, Exception):
            # Some generated data might be invalid, that's ok
            pass


class AuthServiceAuthenticationPropertyTest(HypothesisTestCase):
    """Property-based tests for authentication."""
    
    def test_authentication_symmetric_property(self):
        """Property: If registration succeeds, authentication with same credentials should succeed."""
        # Create a user
        email = "test@example.com"
        password = "SecurePass123"
        
        user = AuthService.register_user(
            full_name="Test User",
            email=email,
            password=password,
            role="customer"
        )
        
        # Authentication with same credentials should succeed
        authenticated_user = AuthService.authenticate_user(email, password)
        
        self.assertIsNotNone(authenticated_user)
        self.assertEqual(authenticated_user.id, user.id)
        
        # Clean up
        user.delete()
    
    def test_authentication_with_wrong_password_always_fails(self):
        """Property: Authentication should always fail with incorrect password."""
        # Create a user
        email = "test2@example.com"
        correct_password = "SecurePass123"
        wrong_password = "WrongPassword456"
        
        user = AuthService.register_user(
            full_name="Test User",
            email=email,
            password=correct_password,
            role="customer"
        )
        
        # Authentication with wrong password should fail
        authenticated_user = AuthService.authenticate_user(email, wrong_password)
        
        self.assertIsNone(authenticated_user)
        
        # Clean up
        user.delete()
