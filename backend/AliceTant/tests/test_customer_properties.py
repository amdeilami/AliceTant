"""
Property-based tests for the Customer model.

This module contains property-based tests using Hypothesis to verify
correctness properties of the Customer model across a wide range of inputs.
"""

from hypothesis import given, settings, strategies as st
from hypothesis.extra.django import TestCase

from AliceTant.models import User, UserRole, Customer


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


def valid_full_name():
    """
    Generate valid full names.
    
    Returns:
        str: A valid full name
    """
    return st.text(
        alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ -.',
        min_size=1,
        max_size=200
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


def valid_preferences():
    """
    Generate valid customer preferences text.
    
    Returns:
        str: A valid preferences text
    """
    return st.text(
        alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?-\n',
        min_size=0,
        max_size=1000
    )


class CustomerPropertyTests(TestCase):
    """
    Property-based tests for Customer model correctness properties.
    """
    
    @settings(max_examples=100, deadline=None)
    @given(
        username=valid_username(),
        email=valid_email(),
        password=valid_password(),
        full_name=valid_full_name(),
        phone_number=valid_phone_number(),
        preferences=valid_preferences()
    )
    def test_property_8_customer_profile_completeness(
        self, username, email, password, full_name, phone_number, preferences
    ):
        """
        Feature: user-data-model, Property 8: Customer profile completeness
        
        For any user with role CUSTOMER, creating a customer profile should store
        and allow retrieval of full_name, phone_number, and preferences fields.
        
        Validates: Requirements 3.1, 3.3
        """
        # Create user with CUSTOMER role
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=UserRole.CUSTOMER
        )
        
        # Create customer profile
        customer = Customer.objects.create(
            user=user,
            full_name=full_name,
            phone_number=phone_number,
            preferences=preferences
        )
        
        # Retrieve customer profile
        retrieved_customer = Customer.objects.get(user=user)
        
        # Verify all fields match
        self.assertEqual(retrieved_customer.full_name, full_name)
        self.assertEqual(retrieved_customer.phone_number, phone_number)
        self.assertEqual(retrieved_customer.preferences, preferences)
        
        # Verify relationship to user
        self.assertEqual(retrieved_customer.user, user)
        self.assertEqual(user.customer_profile, retrieved_customer)
