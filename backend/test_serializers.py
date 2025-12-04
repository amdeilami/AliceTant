#!/usr/bin/env python3
"""
Quick test script to verify serializers work correctly.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AliceTant_Engine.settings')
django.setup()

from AliceTant.serializers import SignupSerializer, LoginSerializer, UserSerializer

print("Testing SignupSerializer...")
print("-" * 50)

# Test valid signup data
signup_data = {
    'full_name': 'John Doe',
    'email': 'test@example.com',
    'phone_number': '1234567890',
    'password': 'securepass123',
    'role': 'customer'
}
serializer = SignupSerializer(data=signup_data)
if serializer.is_valid():
    print("✓ Valid signup data accepted")
    print(f"  Role normalized: {serializer.validated_data['role']}")
else:
    print("✗ Valid signup data rejected:", serializer.errors)

# Test invalid email
invalid_email_data = signup_data.copy()
invalid_email_data['email'] = 'not-an-email'
serializer = SignupSerializer(data=invalid_email_data)
if not serializer.is_valid():
    print("✓ Invalid email rejected")
else:
    print("✗ Invalid email accepted")

# Test short password
short_password_data = signup_data.copy()
short_password_data['password'] = 'short'
serializer = SignupSerializer(data=short_password_data)
if not serializer.is_valid():
    print("✓ Short password rejected")
else:
    print("✗ Short password accepted")

# Test missing required field
missing_field_data = signup_data.copy()
del missing_field_data['email']
serializer = SignupSerializer(data=missing_field_data)
if not serializer.is_valid():
    print("✓ Missing required field rejected")
else:
    print("✗ Missing required field accepted")

# Test optional phone_number
no_phone_data = signup_data.copy()
no_phone_data['phone_number'] = None
serializer = SignupSerializer(data=no_phone_data)
if serializer.is_valid():
    print("✓ Optional phone_number (null) accepted")
else:
    print("✗ Optional phone_number (null) rejected:", serializer.errors)

print("\nTesting LoginSerializer...")
print("-" * 50)

# Test valid login data
login_data = {
    'email': 'test@example.com',
    'password': 'securepass123'
}
serializer = LoginSerializer(data=login_data)
if serializer.is_valid():
    print("✓ Valid login data accepted")
    print(f"  Email normalized: {serializer.validated_data['email']}")
else:
    print("✗ Valid login data rejected:", serializer.errors)

# Test missing password
missing_password_data = {'email': 'test@example.com'}
serializer = LoginSerializer(data=missing_password_data)
if not serializer.is_valid():
    print("✓ Missing password rejected")
else:
    print("✗ Missing password accepted")

print("\nAll serializer tests completed!")
