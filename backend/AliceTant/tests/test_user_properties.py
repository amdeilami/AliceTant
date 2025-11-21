"""
Property-based tests for the User model.

This module contains property-based tests using Hypothesis to verify
correctness properties of the User model across a wide range of inputs.
"""

from django.contrib.auth.hashers import check_password
from django.db import IntegrityError
from hypothesis import given, settings, strategies as st
from hypothesis.extra.django import TestCase

from AliceTant.models import User, UserRole
from AliceTant.exceptions import DuplicateUserError


# Hypothesis strategies for generating test data
def valid_username():
    """
    Generate valid usernames (alphanumeric, 3-30 chars).
    
    Returns:
        str: A valid username
    """
    return st.text(
        alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        min_size=3,
        max_size=30
    )


def valid_email():
    """
    Generate valid email addresses.
    
    Returns:
        str: A valid email address
    """
    return st.builds(
        lambda local, domain, tld: f"{local}@{domain}.{tld}",
        local=st.text(alphabet='abcdefghijklmnopqrstuvwxyz0123456789', min_size=1, max_size=20),
        domain=st.text(alphabet='abcdefghijklmnopqrstuvwxyz', min_size=1, max_size=20),
        tld=st.sampled_from(['com', 'org', 'net', 'edu', 'gov'])
    )


def valid_password():
    """
    Generate valid passwords (8-30 chars).
    
    Returns:
        str: A valid password
    """
    return st.text(
        alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%',
        min_size=8,
        max_size=30
    )


def valid_role():
    """
    Generate valid user roles.
    
    Returns:
        str: A valid role (PROVIDER or CUSTOMER)
    """
    return st.sampled_from([UserRole.PROVIDER, UserRole.CUSTOMER])


class UserPropertyTests(TestCase):
    """
    Property-based tests for User model correctness properties.
    """
    
    @settings(max_examples=100, deadline=None)
    @given(
        username=valid_username(),
        email=valid_email(),
        password=valid_password(),
        role=valid_role()
    )
    def test_property_1_user_creation_round_trip(self, username, email, password, role):
        """
        Feature: user-data-model, Property 1: User creation round trip
        
        For any valid user data (username, email, password, role), creating a user
        and then retrieving it by ID should return a user with all the same field
        values (except password should be hashed).
        
        Validates: Requirements 1.1, 1.4
        """
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role
        )
        
        # Retrieve user by ID
        retrieved_user = User.objects.get(id=user.id)
        
        # Verify all fields match (except password which should be hashed)
        self.assertEqual(retrieved_user.username, username)
        self.assertEqual(retrieved_user.email, email)
        self.assertEqual(retrieved_user.role, role)
        
        # Password should be hashed, not plaintext
        self.assertNotEqual(retrieved_user.password, password)
        self.assertTrue(check_password(password, retrieved_user.password))
        
        # Timestamps should be set
        self.assertIsNotNone(retrieved_user.created_at)
        self.assertIsNotNone(retrieved_user.updated_at)
    
    @settings(max_examples=100, deadline=None)
    @given(
        username=valid_username(),
        email=valid_email(),
        password=valid_password(),
        role=valid_role()
    )
    def test_property_2_role_assignment_validity(self, username, email, password, role):
        """
        Feature: user-data-model, Property 2: Role assignment validity
        
        For any created user, the user's role must be exactly one value from
        the set {PROVIDER, CUSTOMER}.
        
        Validates: Requirements 1.2
        """
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role
        )
        
        # Verify role is valid
        self.assertIn(user.role, [UserRole.PROVIDER, UserRole.CUSTOMER])
        
        # Verify role matches what was set
        self.assertEqual(user.role, role)
    
    @settings(max_examples=100, deadline=None)
    @given(
        username=valid_username(),
        email=valid_email(),
        password=valid_password(),
        role=valid_role()
    )
    def test_property_4_password_hashing(self, username, email, password, role):
        """
        Feature: user-data-model, Property 4: Password hashing
        
        For any user created with a plaintext password, the stored password
        field should not equal the plaintext password.
        
        Validates: Requirements 1.4
        """
        # Create user with plaintext password
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role
        )
        
        # Password should be hashed
        self.assertNotEqual(user.password, password)
        
        # But should verify correctly
        self.assertTrue(check_password(password, user.password))
    
    @settings(max_examples=100, deadline=None)
    @given(
        username=valid_username(),
        email=valid_email(),
        password=valid_password(),
        role=valid_role()
    )
    def test_property_5_timestamp_management(self, username, email, password, role):
        """
        Feature: user-data-model, Property 5: Timestamp management
        
        For any user, the created_at timestamp should be set on creation,
        and the updated_at timestamp should change when the user is modified.
        
        Validates: Requirements 1.5
        """
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role
        )
        
        # Verify created_at is set
        self.assertIsNotNone(user.created_at)
        original_created_at = user.created_at
        
        # Verify updated_at is set
        self.assertIsNotNone(user.updated_at)
        original_updated_at = user.updated_at
        
        # created_at and updated_at should be close (within a second)
        time_diff = abs((user.updated_at - user.created_at).total_seconds())
        self.assertLess(time_diff, 1.0)
        
        # Modify user
        user.first_name = "Updated"
        user.save()
        
        # Reload from database
        user.refresh_from_db()
        
        # created_at should not change
        self.assertEqual(user.created_at, original_created_at)
        
        # updated_at should change
        self.assertGreater(user.updated_at, original_updated_at)
