"""
Unit tests for User model edge cases.

This module contains unit tests that verify specific edge cases and
constraints for the User model.
"""

from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth.hashers import check_password

from AliceTant.models import User, UserRole


class UserUnitTests(TestCase):
    """
    Unit tests for User model edge cases and constraints.
    """
    
    def test_email_uniqueness_constraint(self):
        """
        Test that email uniqueness constraint is enforced.
        
        Requirements: 1.3
        """
        # Create first user
        User.objects.create_user(
            username='user1',
            email='test@example.com',
            password='password123',
            role=UserRole.PROVIDER
        )
        
        # Attempt to create second user with same email
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username='user2',
                email='test@example.com',
                password='password456',
                role=UserRole.CUSTOMER
            )
    
    def test_username_uniqueness_constraint(self):
        """
        Test that username uniqueness constraint is enforced.
        
        Requirements: 1.3
        """
        # Create first user
        User.objects.create_user(
            username='testuser',
            email='user1@example.com',
            password='password123',
            role=UserRole.PROVIDER
        )
        
        # Attempt to create second user with same username
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username='testuser',
                email='user2@example.com',
                password='password456',
                role=UserRole.CUSTOMER
            )
    
    def test_role_validation_provider(self):
        """
        Test that PROVIDER role is accepted.
        
        Requirements: 1.3
        """
        user = User.objects.create_user(
            username='provider_user',
            email='provider@example.com',
            password='password123',
            role=UserRole.PROVIDER
        )
        
        self.assertEqual(user.role, UserRole.PROVIDER)
        self.assertTrue(user.is_provider())
        self.assertFalse(user.is_customer())
    
    def test_role_validation_customer(self):
        """
        Test that CUSTOMER role is accepted.
        
        Requirements: 1.3
        """
        user = User.objects.create_user(
            username='customer_user',
            email='customer@example.com',
            password='password123',
            role=UserRole.CUSTOMER
        )
        
        self.assertEqual(user.role, UserRole.CUSTOMER)
        self.assertTrue(user.is_customer())
        self.assertFalse(user.is_provider())
    
    def test_password_hashing_on_user_creation(self):
        """
        Test that password is hashed when user is created.
        
        Requirements: 1.4
        """
        plaintext_password = 'my_secure_password_123'
        
        user = User.objects.create_user(
            username='test_user',
            email='test@example.com',
            password=plaintext_password,
            role=UserRole.PROVIDER
        )
        
        # Password should not be stored in plaintext
        self.assertNotEqual(user.password, plaintext_password)
        
        # Password should verify correctly
        self.assertTrue(check_password(plaintext_password, user.password))
        
        # Password hash should start with algorithm identifier
        self.assertTrue(user.password.startswith('pbkdf2_sha256$'))
