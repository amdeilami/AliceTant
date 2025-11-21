"""
Unit tests for UserRepository error handling.

This module contains unit tests that verify proper exception handling
in the UserRepository for various error scenarios.
"""

from django.test import TestCase

from AliceTant.models import User, UserRole
from AliceTant.repositories.user_repository import UserRepository
from AliceTant.exceptions import (
    UserNotFoundError,
    DuplicateUserError,
    InvalidUserDataError
)


class RepositoryErrorHandlingTests(TestCase):
    """
    Unit tests for UserRepository error handling.
    
    Tests that appropriate exceptions are raised for various error conditions
    including user not found, duplicate users, and invalid data.
    """
    
    def test_user_not_found_by_id(self):
        """
        Test that UserNotFoundError is raised for non-existent user ID.
        
        Validates: Requirements 6.1
        """
        with self.assertRaises(UserNotFoundError) as context:
            UserRepository.get_user_by_id(99999)
        
        self.assertIn('99999', str(context.exception))
        self.assertIn('not found', str(context.exception).lower())
    
    def test_user_not_found_by_username(self):
        """
        Test that UserNotFoundError is raised for non-existent username.
        
        Validates: Requirements 6.1
        """
        with self.assertRaises(UserNotFoundError) as context:
            UserRepository.get_user_by_username('nonexistent_user')
        
        self.assertIn('nonexistent_user', str(context.exception))
        self.assertIn('not found', str(context.exception).lower())
    
    def test_user_not_found_by_email(self):
        """
        Test that UserNotFoundError is raised for non-existent email.
        
        Validates: Requirements 6.1
        """
        with self.assertRaises(UserNotFoundError) as context:
            UserRepository.get_user_by_email('nonexistent@example.com')
        
        self.assertIn('nonexistent@example.com', str(context.exception))
        self.assertIn('not found', str(context.exception).lower())
    
    def test_duplicate_username_error(self):
        """
        Test that DuplicateUserError is raised for duplicate username.
        
        Validates: Requirements 6.2
        """
        # Create first user
        UserRepository.create_user(
            username='testuser',
            email='test1@example.com',
            password='SecurePass123!@',
            role=UserRole.PROVIDER
        )
        
        # Attempt to create user with same username
        with self.assertRaises(DuplicateUserError) as context:
            UserRepository.create_user(
                username='testuser',  # Same username
                email='test2@example.com',  # Different email
                password='SecurePass123!@',
                role=UserRole.CUSTOMER
            )
        
        self.assertIn('testuser', str(context.exception))
        self.assertIn('already exists', str(context.exception).lower())
    
    def test_duplicate_email_error(self):
        """
        Test that DuplicateUserError is raised for duplicate email.
        
        Validates: Requirements 6.2
        """
        # Create first user
        UserRepository.create_user(
            username='testuser1',
            email='test@example.com',
            password='SecurePass123!@',
            role=UserRole.PROVIDER
        )
        
        # Attempt to create user with same email
        with self.assertRaises(DuplicateUserError) as context:
            UserRepository.create_user(
                username='testuser2',  # Different username
                email='test@example.com',  # Same email
                password='SecurePass123!@',
                role=UserRole.CUSTOMER
            )
        
        self.assertIn('test@example.com', str(context.exception))
        self.assertIn('already exists', str(context.exception).lower())
    
    def test_invalid_email_format(self):
        """
        Test that InvalidUserDataError is raised for invalid email format.
        
        Validates: Requirements 6.4
        """
        with self.assertRaises(InvalidUserDataError) as context:
            UserRepository.create_user(
                username='testuser',
                email='invalid-email',  # Invalid format
                password='SecurePass123!@',
                role=UserRole.PROVIDER
            )
        
        self.assertIn('email', str(context.exception).lower())
        self.assertIn('invalid', str(context.exception).lower())
    
    def test_invalid_role(self):
        """
        Test that InvalidUserDataError is raised for invalid role.
        
        Validates: Requirements 6.4
        """
        with self.assertRaises(InvalidUserDataError) as context:
            UserRepository.create_user(
                username='testuser',
                email='test@example.com',
                password='SecurePass123!@',
                role='INVALID_ROLE'  # Invalid role
            )
        
        self.assertIn('role', str(context.exception).lower())
        self.assertIn('invalid', str(context.exception).lower())
    
    def test_weak_password(self):
        """
        Test that InvalidUserDataError is raised for weak password.
        
        Validates: Requirements 6.4
        """
        with self.assertRaises(InvalidUserDataError) as context:
            UserRepository.create_user(
                username='testuser',
                email='test@example.com',
                password='123',  # Too short
                role=UserRole.PROVIDER
            )
        
        self.assertIn('password', str(context.exception).lower())
    
    def test_provider_wrong_role(self):
        """
        Test that InvalidUserDataError is raised when creating provider
        profile for user with CUSTOMER role.
        
        Validates: Requirements 6.4
        """
        # Create customer user
        user = UserRepository.create_user(
            username='customer',
            email='customer@example.com',
            password='SecurePass123!@',
            role=UserRole.CUSTOMER
        )
        
        # Attempt to create provider profile
        with self.assertRaises(InvalidUserDataError) as context:
            UserRepository.create_provider(
                user=user,
                business_name='Test Business'
            )
        
        self.assertIn('provider', str(context.exception).lower())
        self.assertIn('role', str(context.exception).lower())
    
    def test_customer_wrong_role(self):
        """
        Test that InvalidUserDataError is raised when creating customer
        profile for user with PROVIDER role.
        
        Validates: Requirements 6.4
        """
        # Create provider user
        user = UserRepository.create_user(
            username='provider',
            email='provider@example.com',
            password='SecurePass123!@',
            role=UserRole.PROVIDER
        )
        
        # Attempt to create customer profile
        with self.assertRaises(InvalidUserDataError) as context:
            UserRepository.create_customer(
                user=user,
                full_name='Test Customer'
            )
        
        self.assertIn('customer', str(context.exception).lower())
        self.assertIn('role', str(context.exception).lower())
    
    def test_provider_bio_too_long(self):
        """
        Test that InvalidUserDataError is raised when provider bio exceeds
        maximum length.
        
        Validates: Requirements 6.4
        """
        # Create provider user
        user = UserRepository.create_user(
            username='provider',
            email='provider@example.com',
            password='SecurePass123!@',
            role=UserRole.PROVIDER
        )
        
        # Attempt to create provider with bio exceeding 4096 chars
        long_bio = 'x' * 4097
        with self.assertRaises(InvalidUserDataError) as context:
            UserRepository.create_provider(
                user=user,
                business_name='Test Business',
                bio=long_bio
            )
        
        self.assertIn('bio', str(context.exception).lower())
        self.assertIn('4096', str(context.exception))
    
    def test_delete_nonexistent_user(self):
        """
        Test that UserNotFoundError is raised when deleting non-existent user.
        
        Validates: Requirements 6.1
        """
        with self.assertRaises(UserNotFoundError) as context:
            UserRepository.delete_user(99999)
        
        self.assertIn('99999', str(context.exception))
        self.assertIn('not found', str(context.exception).lower())
    
    def test_update_duplicate_email(self):
        """
        Test that DuplicateUserError is raised when updating to existing email.
        
        Validates: Requirements 6.2
        """
        # Create two users
        user1 = UserRepository.create_user(
            username='user1',
            email='user1@example.com',
            password='SecurePass123!@',
            role=UserRole.PROVIDER
        )
        
        user2 = UserRepository.create_user(
            username='user2',
            email='user2@example.com',
            password='SecurePass123!@',
            role=UserRole.CUSTOMER
        )
        
        # Attempt to update user2's email to user1's email
        with self.assertRaises(DuplicateUserError) as context:
            UserRepository.update_user(user2, email='user1@example.com')
        
        self.assertIn('user1@example.com', str(context.exception))
        self.assertIn('already exists', str(context.exception).lower())
    
    def test_update_duplicate_username(self):
        """
        Test that DuplicateUserError is raised when updating to existing username.
        
        Validates: Requirements 6.2
        """
        # Create two users
        user1 = UserRepository.create_user(
            username='user1',
            email='user1@example.com',
            password='SecurePass123!@',
            role=UserRole.PROVIDER
        )
        
        user2 = UserRepository.create_user(
            username='user2',
            email='user2@example.com',
            password='SecurePass123!@',
            role=UserRole.CUSTOMER
        )
        
        # Attempt to update user2's username to user1's username
        with self.assertRaises(DuplicateUserError) as context:
            UserRepository.update_user(user2, username='user1')
        
        self.assertIn('user1', str(context.exception))
        self.assertIn('already exists', str(context.exception).lower())
