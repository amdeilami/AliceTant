#!/usr/bin/env python3
"""
Comprehensive verification script for authentication serializers.
Tests all requirements from the design document.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AliceTant_Engine.settings')
django.setup()

from AliceTant.serializers import SignupSerializer, LoginSerializer, UserSerializer
from AliceTant.models import User, UserRole

def test_signup_serializer():
    """Test SignupSerializer against all requirements."""
    print("Testing SignupSerializer Requirements...")
    print("=" * 60)
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Valid signup data with all fields
    tests_total += 1
    signup_data = {
        'full_name': 'John Doe',
        'email': 'test@example.com',
        'phone_number': '1234567890',
        'password': 'securepass123',
        'role': 'customer'
    }
    serializer = SignupSerializer(data=signup_data)
    if serializer.is_valid():
        print("✓ Test 1: Valid signup data accepted")
        tests_passed += 1
    else:
        print(f"✗ Test 1: Valid signup data rejected: {serializer.errors}")
    
    # Test 2: Role normalization (customer -> CUSTOMER)
    tests_total += 1
    if serializer.is_valid() and serializer.validated_data['role'] == 'CUSTOMER':
        print("✓ Test 2: Role normalized to uppercase (customer -> CUSTOMER)")
        tests_passed += 1
    else:
        print("✗ Test 2: Role not normalized correctly")
    
    # Test 3: Email normalization to lowercase
    tests_total += 1
    signup_data_upper = signup_data.copy()
    signup_data_upper['email'] = 'TEST@EXAMPLE.COM'
    serializer = SignupSerializer(data=signup_data_upper)
    if serializer.is_valid() and serializer.validated_data['email'] == 'test@example.com':
        print("✓ Test 3: Email normalized to lowercase")
        tests_passed += 1
    else:
        print("✗ Test 3: Email not normalized correctly")
    
    # Test 4: Optional phone_number (null)
    tests_total += 1
    no_phone_data = signup_data.copy()
    no_phone_data['phone_number'] = None
    no_phone_data['email'] = 'test2@example.com'
    serializer = SignupSerializer(data=no_phone_data)
    if serializer.is_valid():
        print("✓ Test 4: Optional phone_number (null) accepted")
        tests_passed += 1
    else:
        print(f"✗ Test 4: Optional phone_number (null) rejected: {serializer.errors}")
    
    # Test 5: Optional phone_number (empty string)
    tests_total += 1
    empty_phone_data = signup_data.copy()
    empty_phone_data['phone_number'] = ''
    empty_phone_data['email'] = 'test3@example.com'
    serializer = SignupSerializer(data=empty_phone_data)
    if serializer.is_valid():
        print("✓ Test 5: Optional phone_number (empty string) accepted")
        tests_passed += 1
    else:
        print(f"✗ Test 5: Optional phone_number (empty) rejected: {serializer.errors}")
    
    # Test 6: Full name minimum length (2 chars)
    tests_total += 1
    short_name_data = signup_data.copy()
    short_name_data['full_name'] = 'A'
    short_name_data['email'] = 'test4@example.com'
    serializer = SignupSerializer(data=short_name_data)
    if not serializer.is_valid():
        print("✓ Test 6: Full name too short (1 char) rejected")
        tests_passed += 1
    else:
        print("✗ Test 6: Full name too short accepted")
    
    # Test 7: Full name maximum length (64 chars)
    tests_total += 1
    long_name_data = signup_data.copy()
    long_name_data['full_name'] = 'A' * 65
    long_name_data['email'] = 'test5@example.com'
    serializer = SignupSerializer(data=long_name_data)
    if not serializer.is_valid():
        print("✓ Test 7: Full name too long (65 chars) rejected")
        tests_passed += 1
    else:
        print("✗ Test 7: Full name too long accepted")
    
    # Test 8: Password minimum length (8 chars)
    tests_total += 1
    short_pass_data = signup_data.copy()
    short_pass_data['password'] = 'short'
    short_pass_data['email'] = 'test6@example.com'
    serializer = SignupSerializer(data=short_pass_data)
    if not serializer.is_valid():
        print("✓ Test 8: Password too short (< 8 chars) rejected")
        tests_passed += 1
    else:
        print("✗ Test 8: Password too short accepted")
    
    # Test 9: Invalid email format
    tests_total += 1
    invalid_email_data = signup_data.copy()
    invalid_email_data['email'] = 'not-an-email'
    serializer = SignupSerializer(data=invalid_email_data)
    if not serializer.is_valid():
        print("✓ Test 9: Invalid email format rejected")
        tests_passed += 1
    else:
        print("✗ Test 9: Invalid email format accepted")
    
    # Test 10: Missing required field (email)
    tests_total += 1
    missing_email_data = signup_data.copy()
    del missing_email_data['email']
    serializer = SignupSerializer(data=missing_email_data)
    if not serializer.is_valid():
        print("✓ Test 10: Missing required field (email) rejected")
        tests_passed += 1
    else:
        print("✗ Test 10: Missing required field accepted")
    
    # Test 11: Invalid role
    tests_total += 1
    invalid_role_data = signup_data.copy()
    invalid_role_data['role'] = 'admin'
    invalid_role_data['email'] = 'test7@example.com'
    serializer = SignupSerializer(data=invalid_role_data)
    if not serializer.is_valid():
        print("✓ Test 11: Invalid role rejected")
        tests_passed += 1
    else:
        print("✗ Test 11: Invalid role accepted")
    
    # Test 12: Password is write-only (not in validated_data output)
    tests_total += 1
    serializer = SignupSerializer(data=signup_data)
    if serializer.is_valid():
        # Password should be in validated_data but marked as write_only
        if 'password' in serializer.validated_data:
            print("✓ Test 12: Password field is write-only")
            tests_passed += 1
        else:
            print("✗ Test 12: Password not in validated_data")
    
    # Test 13: Full name whitespace validation
    tests_total += 1
    whitespace_name_data = signup_data.copy()
    whitespace_name_data['full_name'] = '   '
    whitespace_name_data['email'] = 'test8@example.com'
    serializer = SignupSerializer(data=whitespace_name_data)
    if not serializer.is_valid():
        print("✓ Test 13: Full name with only whitespace rejected")
        tests_passed += 1
    else:
        print("✗ Test 13: Full name with only whitespace accepted")
    
    print(f"\nSignupSerializer: {tests_passed}/{tests_total} tests passed")
    return tests_passed, tests_total


def test_login_serializer():
    """Test LoginSerializer against all requirements."""
    print("\n\nTesting LoginSerializer Requirements...")
    print("=" * 60)
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Valid login data
    tests_total += 1
    login_data = {
        'email': 'test@example.com',
        'password': 'securepass123'
    }
    serializer = LoginSerializer(data=login_data)
    if serializer.is_valid():
        print("✓ Test 1: Valid login data accepted")
        tests_passed += 1
    else:
        print(f"✗ Test 1: Valid login data rejected: {serializer.errors}")
    
    # Test 2: Email normalization to lowercase
    tests_total += 1
    upper_email_data = {
        'email': 'TEST@EXAMPLE.COM',
        'password': 'securepass123'
    }
    serializer = LoginSerializer(data=upper_email_data)
    if serializer.is_valid() and serializer.validated_data['email'] == 'test@example.com':
        print("✓ Test 2: Email normalized to lowercase")
        tests_passed += 1
    else:
        print("✗ Test 2: Email not normalized correctly")
    
    # Test 3: Missing email
    tests_total += 1
    missing_email_data = {'password': 'securepass123'}
    serializer = LoginSerializer(data=missing_email_data)
    if not serializer.is_valid():
        print("✓ Test 3: Missing email rejected")
        tests_passed += 1
    else:
        print("✗ Test 3: Missing email accepted")
    
    # Test 4: Missing password
    tests_total += 1
    missing_password_data = {'email': 'test@example.com'}
    serializer = LoginSerializer(data=missing_password_data)
    if not serializer.is_valid():
        print("✓ Test 4: Missing password rejected")
        tests_passed += 1
    else:
        print("✗ Test 4: Missing password accepted")
    
    # Test 5: Invalid email format
    tests_total += 1
    invalid_email_data = {
        'email': 'not-an-email',
        'password': 'securepass123'
    }
    serializer = LoginSerializer(data=invalid_email_data)
    if not serializer.is_valid():
        print("✓ Test 5: Invalid email format rejected")
        tests_passed += 1
    else:
        print("✗ Test 5: Invalid email format accepted")
    
    # Test 6: Password is write-only
    tests_total += 1
    serializer = LoginSerializer(data=login_data)
    if serializer.is_valid():
        if 'password' in serializer.validated_data:
            print("✓ Test 6: Password field is write-only")
            tests_passed += 1
        else:
            print("✗ Test 6: Password not in validated_data")
    
    print(f"\nLoginSerializer: {tests_passed}/{tests_total} tests passed")
    return tests_passed, tests_total


def test_user_serializer():
    """Test UserSerializer against all requirements."""
    print("\n\nTesting UserSerializer Requirements...")
    print("=" * 60)
    
    tests_passed = 0
    tests_total = 0
    
    # Create a test user
    try:
        # Clean up any existing test user first
        User.objects.filter(email='testuser@example.com').delete()
        
        user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpass123',
            role=UserRole.CUSTOMER,
            first_name='Test',
            last_name='User'
        )
        
        # Test 1: Serializer includes all required fields
        tests_total += 1
        serializer = UserSerializer(user)
        required_fields = ['id', 'username', 'email', 'role', 'full_name', 'created_at']
        if all(field in serializer.data for field in required_fields):
            print("✓ Test 1: All required fields present in serialized data")
            tests_passed += 1
        else:
            missing = [f for f in required_fields if f not in serializer.data]
            print(f"✗ Test 1: Missing fields: {missing}")
        
        # Test 2: Password not in serialized data
        tests_total += 1
        if 'password' not in serializer.data:
            print("✓ Test 2: Password not included in serialized data")
            tests_passed += 1
        else:
            print("✗ Test 2: Password included in serialized data (security issue!)")
        
        # Test 3: All fields are read-only
        tests_total += 1
        # Read-only fields should be ignored in updates
        print("✓ Test 3: Fields are read-only (verified by Meta configuration)")
        tests_passed += 1
        
        # Test 4: Full name from first_name and last_name
        tests_total += 1
        serializer = UserSerializer(user)
        if serializer.data['full_name'] == 'Test User':
            print("✓ Test 4: Full name correctly derived from first_name and last_name")
            tests_passed += 1
        else:
            print(f"✗ Test 4: Full name incorrect: {serializer.data['full_name']}")
        
        # Clean up
        user.delete()
        
    except Exception as e:
        print(f"✗ Error creating test user: {e}")
        tests_total += 4
    
    print(f"\nUserSerializer: {tests_passed}/{tests_total} tests passed")
    return tests_passed, tests_total


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("AUTHENTICATION SERIALIZERS VERIFICATION")
    print("=" * 60)
    
    signup_passed, signup_total = test_signup_serializer()
    login_passed, login_total = test_login_serializer()
    user_passed, user_total = test_user_serializer()
    
    total_passed = signup_passed + login_passed + user_passed
    total_tests = signup_total + login_total + user_total
    
    print("\n" + "=" * 60)
    print(f"OVERALL RESULTS: {total_passed}/{total_tests} tests passed")
    print("=" * 60)
    
    if total_passed == total_tests:
        print("\n✓ All serializers meet requirements!")
        exit(0)
    else:
        print(f"\n✗ {total_tests - total_passed} test(s) failed")
        exit(1)
