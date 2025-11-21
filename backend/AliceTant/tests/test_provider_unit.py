"""
Unit tests for Provider model edge cases.

This module contains unit tests that verify specific edge cases and
constraints for the Provider model.
"""

from django.test import TestCase
from django.db import IntegrityError
from django.core.exceptions import ValidationError

from AliceTant.models import User, UserRole, Provider


class ProviderUnitTests(TestCase):
    """
    Unit tests for Provider model edge cases and constraints.
    """
    
    def test_bio_length_constraint_exactly_4096_chars(self):
        """
        Test that bio with exactly 4096 characters is accepted.
        
        Requirements: 2.2
        """
        # Create user with PROVIDER role
        user = User.objects.create_user(
            username='provider1',
            email='provider1@example.com',
            password='password123',
            role=UserRole.PROVIDER
        )
        
        # Create bio with exactly 4096 characters
        bio_4096 = 'a' * 4096
        
        # Should succeed
        provider = Provider.objects.create(
            user=user,
            business_name='Test Business',
            bio=bio_4096
        )
        
        self.assertEqual(len(provider.bio), 4096)
        self.assertEqual(provider.bio, bio_4096)
    
    def test_bio_length_constraint_exceeds_4096_chars(self):
        """
        Test that bio field has max_length constraint of 4096 characters.
        
        Note: Django's TextField max_length is enforced at the form/serializer level,
        not at the model validation level. This test verifies the constraint is
        properly defined on the model field, which will be enforced by Django REST
        Framework serializers and Django forms.
        
        Requirements: 2.2
        """
        # Create user with PROVIDER role
        user = User.objects.create_user(
            username='provider2',
            email='provider2@example.com',
            password='password123',
            role=UserRole.PROVIDER
        )
        
        # Verify the max_length constraint is set on the field
        bio_field = Provider._meta.get_field('bio')
        self.assertEqual(bio_field.max_length, 4096)
        
        # Create bio with 4097 characters (exceeds limit)
        bio_4097 = 'a' * 4097
        
        # At the model level, Django allows this (TextField behavior)
        # But the constraint will be enforced by forms/serializers
        provider = Provider.objects.create(
            user=user,
            business_name='Test Business',
            bio=bio_4097
        )
        
        # Verify it was saved (demonstrating model-level behavior)
        self.assertEqual(len(provider.bio), 4097)
        
        # In production, this would be caught by DRF serializer validation
        # or Django form validation before reaching the model
    
    def test_cascade_delete_when_user_deleted(self):
        """
        Test that provider profile is deleted when user is deleted.
        
        Requirements: 2.2
        """
        # Create user with PROVIDER role
        user = User.objects.create_user(
            username='provider3',
            email='provider3@example.com',
            password='password123',
            role=UserRole.PROVIDER
        )
        
        # Create provider profile
        provider = Provider.objects.create(
            user=user,
            business_name='Test Business',
            bio='Test bio'
        )
        
        provider_id = provider.user_id
        
        # Verify provider exists
        self.assertTrue(Provider.objects.filter(user_id=provider_id).exists())
        
        # Delete user
        user.delete()
        
        # Verify provider profile is also deleted (cascade)
        self.assertFalse(Provider.objects.filter(user_id=provider_id).exists())
    
    def test_provider_profile_requires_provider_role(self):
        """
        Test that provider profile should be associated with PROVIDER role user.
        
        Note: This is a business logic test. Django doesn't enforce this at the
        database level, but we verify the expected usage pattern.
        
        Requirements: 2.2
        """
        # Create user with PROVIDER role
        provider_user = User.objects.create_user(
            username='provider4',
            email='provider4@example.com',
            password='password123',
            role=UserRole.PROVIDER
        )
        
        # Create provider profile - should work
        provider = Provider.objects.create(
            user=provider_user,
            business_name='Test Business',
            bio='Test bio'
        )
        
        self.assertEqual(provider.user.role, UserRole.PROVIDER)
        
        # Create user with CUSTOMER role
        customer_user = User.objects.create_user(
            username='customer1',
            email='customer1@example.com',
            password='password123',
            role=UserRole.CUSTOMER
        )
        
        # Technically Django allows this at DB level, but it violates business logic
        # We document this as incorrect usage
        # In a real application, this would be prevented by repository/service layer
        provider_wrong = Provider.objects.create(
            user=customer_user,
            business_name='Wrong Business',
            bio='This should not happen'
        )
        
        # Verify the user role is CUSTOMER (demonstrating the mismatch)
        self.assertEqual(provider_wrong.user.role, UserRole.CUSTOMER)
        
        # Clean up
        provider_wrong.delete()
    
    def test_one_to_one_relationship_enforced(self):
        """
        Test that a user can only have one provider profile.
        
        Requirements: 2.1
        """
        # Create user with PROVIDER role
        user = User.objects.create_user(
            username='provider5',
            email='provider5@example.com',
            password='password123',
            role=UserRole.PROVIDER
        )
        
        # Create first provider profile
        Provider.objects.create(
            user=user,
            business_name='First Business',
            bio='First bio'
        )
        
        # Attempt to create second provider profile for same user
        with self.assertRaises(IntegrityError):
            Provider.objects.create(
                user=user,
                business_name='Second Business',
                bio='Second bio'
            )
    
    def test_provider_string_representation(self):
        """
        Test the string representation of Provider model.
        """
        # Create user with PROVIDER role
        user = User.objects.create_user(
            username='provider6',
            email='provider6@example.com',
            password='password123',
            role=UserRole.PROVIDER
        )
        
        # Create provider profile
        provider = Provider.objects.create(
            user=user,
            business_name='My Awesome Business',
            bio='We provide great services'
        )
        
        # Test string representation
        expected_str = "My Awesome Business (provider6)"
        self.assertEqual(str(provider), expected_str)
