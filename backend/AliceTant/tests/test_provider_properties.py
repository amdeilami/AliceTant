"""
Property-based tests for the Provider model.

This module contains property-based tests using Hypothesis to verify
correctness properties of the Provider model across a wide range of inputs.
"""

from hypothesis import given, settings, strategies as st
from hypothesis.extra.django import TestCase

from AliceTant.models import User, UserRole, Provider


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


def valid_business_name():
    """
    Generate valid business names.
    
    Returns:
        str: A valid business name
    """
    return st.text(
        alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 &-.',
        min_size=1,
        max_size=200
    )


def valid_bio():
    """
    Generate valid bio text (up to 4096 chars).
    
    Returns:
        str: A valid bio
    """
    return st.text(
        alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?-\n',
        min_size=0,
        max_size=4096
    )


def valid_phone_number():
    """
    Generate valid phone numbers.
    
    Returns:
        str: A valid phone number
    """
    return st.text(
        alphabet='0123456789+-() ',
        min_size=0,
        max_size=20
    )


def valid_address():
    """
    Generate valid addresses.
    
    Returns:
        str: A valid address
    """
    return st.text(
        alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,#-\n',
        min_size=0,
        max_size=500
    )


class ProviderPropertyTests(TestCase):
    """
    Property-based tests for Provider model correctness properties.
    """
    
    @settings(max_examples=100, deadline=None)
    @given(
        username=valid_username(),
        email=valid_email(),
        password=valid_password(),
        business_name=valid_business_name(),
        bio=valid_bio(),
        phone_number=valid_phone_number(),
        address=valid_address()
    )
    def test_property_6_provider_profile_completeness(
        self, username, email, password, business_name, bio, phone_number, address
    ):
        """
        Feature: user-data-model, Property 6: Provider profile completeness
        
        For any user with role PROVIDER, creating a provider profile should store
        and allow retrieval of business_name, bio, phone_number, and address fields.
        
        Validates: Requirements 2.1, 2.3
        """
        # Create user with PROVIDER role
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=UserRole.PROVIDER
        )
        
        # Create provider profile
        provider = Provider.objects.create(
            user=user,
            business_name=business_name,
            bio=bio,
            phone_number=phone_number,
            address=address
        )
        
        # Retrieve provider profile
        retrieved_provider = Provider.objects.get(user=user)
        
        # Verify all fields match
        self.assertEqual(retrieved_provider.business_name, business_name)
        self.assertEqual(retrieved_provider.bio, bio)
        self.assertEqual(retrieved_provider.phone_number, phone_number)
        self.assertEqual(retrieved_provider.address, address)
        
        # Verify relationship to user
        self.assertEqual(retrieved_provider.user, user)
        self.assertEqual(user.provider_profile, retrieved_provider)
    
    @settings(max_examples=100, deadline=None)
    @given(
        username=valid_username(),
        email=valid_email(),
        password=valid_password(),
        business_name=valid_business_name(),
        bio=valid_bio(),
        phone_number=valid_phone_number(),
        address=valid_address(),
        new_business_name=valid_business_name(),
        new_bio=valid_bio()
    )
    def test_property_7_provider_update_preserves_credentials(
        self, username, email, password, business_name, bio, phone_number, 
        address, new_business_name, new_bio
    ):
        """
        Feature: user-data-model, Property 7: Provider update preserves credentials
        
        For any provider, updating provider-specific fields (business_name, bio, etc.)
        should not change the associated user's username, email, or password.
        
        Validates: Requirements 2.4
        """
        # Create user with PROVIDER role
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=UserRole.PROVIDER
        )
        
        # Store original credentials
        original_username = user.username
        original_email = user.email
        original_password = user.password
        
        # Create provider profile
        provider = Provider.objects.create(
            user=user,
            business_name=business_name,
            bio=bio,
            phone_number=phone_number,
            address=address
        )
        
        # Update provider fields
        provider.business_name = new_business_name
        provider.bio = new_bio
        provider.save()
        
        # Reload user from database
        user.refresh_from_db()
        
        # Verify user credentials are unchanged
        self.assertEqual(user.username, original_username)
        self.assertEqual(user.email, original_email)
        self.assertEqual(user.password, original_password)
        
        # Verify provider fields were updated
        provider.refresh_from_db()
        self.assertEqual(provider.business_name, new_business_name)
        self.assertEqual(provider.bio, new_bio)
