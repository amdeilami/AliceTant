"""
Unit tests for Customer model edge cases.

This module contains unit tests that verify specific edge cases and
constraints for the Customer model.
"""

from django.test import TestCase
from django.db import IntegrityError

from AliceTant.models import User, UserRole, Customer


class CustomerUnitTests(TestCase):
    """
    Unit tests for Customer model edge cases and constraints.
    """
    
    def test_cascade_delete_when_user_deleted(self):
        """
        Test that customer profile is deleted when user is deleted.
        
        Requirements: 3.1, 3.3
        """
        # Create user with CUSTOMER role
        user = User.objects.create_user(
            username='customer1',
            email='customer1@example.com',
            password='password123',
            role=UserRole.CUSTOMER
        )
        
        # Create customer profile
        customer = Customer.objects.create(
            user=user,
            full_name='John Doe',
            phone_number='555-1234'
        )
        
        customer_id = customer.user_id
        
        # Verify customer exists
        self.assertTrue(Customer.objects.filter(user_id=customer_id).exists())
        
        # Delete user
        user.delete()
        
        # Verify customer profile is also deleted (cascade)
        self.assertFalse(Customer.objects.filter(user_id=customer_id).exists())
    
    def test_customer_profile_requires_customer_role(self):
        """
        Test that customer profile should be associated with CUSTOMER role user.
        
        Note: This is a business logic test. Django doesn't enforce this at the
        database level, but we verify the expected usage pattern.
        
        Requirements: 3.1, 3.3
        """
        # Create user with CUSTOMER role
        customer_user = User.objects.create_user(
            username='customer2',
            email='customer2@example.com',
            password='password123',
            role=UserRole.CUSTOMER
        )
        
        # Create customer profile - should work
        customer = Customer.objects.create(
            user=customer_user,
            full_name='Jane Smith',
            phone_number='555-5678'
        )
        
        self.assertEqual(customer.user.role, UserRole.CUSTOMER)
        
        # Create user with PROVIDER role
        provider_user = User.objects.create_user(
            username='provider1',
            email='provider1@example.com',
            password='password123',
            role=UserRole.PROVIDER
        )
        
        # Technically Django allows this at DB level, but it violates business logic
        # We document this as incorrect usage
        # In a real application, this would be prevented by repository/service layer
        customer_wrong = Customer.objects.create(
            user=provider_user,
            full_name='Wrong Customer',
            phone_number='555-9999'
        )
        
        # Verify the user role is PROVIDER (demonstrating the mismatch)
        self.assertEqual(customer_wrong.user.role, UserRole.PROVIDER)
        
        # Clean up
        customer_wrong.delete()
    
    def test_optional_preferences_field(self):
        """
        Test that preferences field is optional and can be empty.
        
        Requirements: 3.1, 3.3
        """
        # Create user with CUSTOMER role
        user = User.objects.create_user(
            username='customer3',
            email='customer3@example.com',
            password='password123',
            role=UserRole.CUSTOMER
        )
        
        # Create customer profile without preferences
        customer = Customer.objects.create(
            user=user,
            full_name='Bob Johnson'
        )
        
        # Verify preferences is empty
        self.assertEqual(customer.preferences, '')
        
        # Update with preferences
        customer.preferences = 'Prefers morning appointments'
        customer.save()
        
        # Verify preferences was updated
        customer.refresh_from_db()
        self.assertEqual(customer.preferences, 'Prefers morning appointments')
        
        # Clear preferences
        customer.preferences = ''
        customer.save()
        
        # Verify preferences can be cleared
        customer.refresh_from_db()
        self.assertEqual(customer.preferences, '')
    
    def test_one_to_one_relationship_enforced(self):
        """
        Test that a user can only have one customer profile.
        
        Requirements: 3.1
        """
        # Create user with CUSTOMER role
        user = User.objects.create_user(
            username='customer4',
            email='customer4@example.com',
            password='password123',
            role=UserRole.CUSTOMER
        )
        
        # Create first customer profile
        Customer.objects.create(
            user=user,
            full_name='First Profile'
        )
        
        # Attempt to create second customer profile for same user
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                user=user,
                full_name='Second Profile'
            )
    
    def test_customer_string_representation(self):
        """
        Test the string representation of Customer model.
        """
        # Create user with CUSTOMER role
        user = User.objects.create_user(
            username='customer5',
            email='customer5@example.com',
            password='password123',
            role=UserRole.CUSTOMER
        )
        
        # Create customer profile
        customer = Customer.objects.create(
            user=user,
            full_name='Alice Wonder',
            phone_number='555-1111'
        )
        
        # Test string representation
        expected_str = "Alice Wonder (customer5)"
        self.assertEqual(str(customer), expected_str)
    
    def test_phone_number_optional(self):
        """
        Test that phone_number field is optional and can be empty.
        
        Requirements: 3.1, 3.3
        """
        # Create user with CUSTOMER role
        user = User.objects.create_user(
            username='customer6',
            email='customer6@example.com',
            password='password123',
            role=UserRole.CUSTOMER
        )
        
        # Create customer profile without phone number
        customer = Customer.objects.create(
            user=user,
            full_name='Charlie Brown'
        )
        
        # Verify phone_number is empty
        self.assertEqual(customer.phone_number, '')
        
        # Update with phone number
        customer.phone_number = '555-2222'
        customer.save()
        
        # Verify phone_number was updated
        customer.refresh_from_db()
        self.assertEqual(customer.phone_number, '555-2222')
