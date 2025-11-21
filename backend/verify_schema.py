#!/usr/bin/env python
"""
Schema verification script for AliceTant User Data Model.

This script verifies that the database schema matches the design document
requirements for User, Provider, and Customer models.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AliceTant_Engine.settings')
django.setup()

from AliceTant.models import User, Provider, Customer, UserRole
from django.db import connection


def verify_user_model():
    """Verify User model schema matches design requirements."""
    print("=" * 60)
    print("VERIFYING USER MODEL")
    print("=" * 60)
    
    # Check table name
    assert User._meta.db_table == 'alicetant_user', "User table name mismatch"
    print("✓ Table name: alicetant_user")
    
    # Check required fields exist
    user_fields = {f.name: f for f in User._meta.get_fields()}
    required_fields = ['username', 'email', 'password', 'role', 'created_at', 'updated_at']
    for field_name in required_fields:
        assert field_name in user_fields, f"Missing required field: {field_name}"
        print(f"✓ Field exists: {field_name}")
    
    # Check email uniqueness
    email_field = User._meta.get_field('email')
    assert email_field.unique, "Email field should be unique"
    print("✓ Email field is unique")
    
    # Check username uniqueness
    username_field = User._meta.get_field('username')
    assert username_field.unique, "Username field should be unique"
    print("✓ Username field is unique")
    
    # Check role choices
    role_field = User._meta.get_field('role')
    role_choices = [choice[0] for choice in role_field.choices]
    assert 'PROVIDER' in role_choices, "PROVIDER role missing"
    assert 'CUSTOMER' in role_choices, "CUSTOMER role missing"
    print(f"✓ Role choices: {role_choices}")
    
    # Check role index
    indexes = User._meta.indexes
    index_names = [idx.name for idx in indexes]
    assert 'user_role_idx' in index_names, "Role index missing"
    print("✓ Role index exists: user_role_idx")
    
    # Check auto timestamps
    created_field = User._meta.get_field('created_at')
    updated_field = User._meta.get_field('updated_at')
    assert created_field.auto_now_add, "created_at should have auto_now_add"
    assert updated_field.auto_now, "updated_at should have auto_now"
    print("✓ Automatic timestamps configured")
    
    print("\n✅ User model verification PASSED\n")


def verify_provider_model():
    """Verify Provider model schema matches design requirements."""
    print("=" * 60)
    print("VERIFYING PROVIDER MODEL")
    print("=" * 60)
    
    # Check table name
    assert Provider._meta.db_table == 'alicetant_provider', "Provider table name mismatch"
    print("✓ Table name: alicetant_provider")
    
    # Check required fields exist
    provider_fields = {f.name: f for f in Provider._meta.get_fields()}
    required_fields = ['user', 'business_name', 'bio', 'phone_number', 'address']
    for field_name in required_fields:
        assert field_name in provider_fields, f"Missing required field: {field_name}"
        print(f"✓ Field exists: {field_name}")
    
    # Check OneToOne relationship
    user_field = Provider._meta.get_field('user')
    assert user_field.one_to_one, "user field should be OneToOne"
    assert user_field.primary_key, "user field should be primary key"
    print("✓ OneToOne relationship with User (primary key)")
    
    # Check cascade delete
    assert user_field.remote_field.on_delete.__name__ == 'CASCADE', "Should cascade delete"
    print("✓ Cascade delete configured")
    
    # Check related name
    assert user_field.remote_field.related_name == 'provider_profile', "Related name mismatch"
    print("✓ Related name: provider_profile")
    
    # Check bio max length
    bio_field = Provider._meta.get_field('bio')
    assert bio_field.max_length == 4096, f"Bio max length should be 4096, got {bio_field.max_length}"
    print("✓ Bio max length: 4096 characters")
    
    print("\n✅ Provider model verification PASSED\n")


def verify_customer_model():
    """Verify Customer model schema matches design requirements."""
    print("=" * 60)
    print("VERIFYING CUSTOMER MODEL")
    print("=" * 60)
    
    # Check table name
    assert Customer._meta.db_table == 'alicetant_customer', "Customer table name mismatch"
    print("✓ Table name: alicetant_customer")
    
    # Check required fields exist
    customer_fields = {f.name: f for f in Customer._meta.get_fields()}
    required_fields = ['user', 'full_name', 'phone_number', 'preferences']
    for field_name in required_fields:
        assert field_name in customer_fields, f"Missing required field: {field_name}"
        print(f"✓ Field exists: {field_name}")
    
    # Check OneToOne relationship
    user_field = Customer._meta.get_field('user')
    assert user_field.one_to_one, "user field should be OneToOne"
    assert user_field.primary_key, "user field should be primary key"
    print("✓ OneToOne relationship with User (primary key)")
    
    # Check cascade delete
    assert user_field.remote_field.on_delete.__name__ == 'CASCADE', "Should cascade delete"
    print("✓ Cascade delete configured")
    
    # Check related name
    assert user_field.remote_field.related_name == 'customer_profile', "Related name mismatch"
    print("✓ Related name: customer_profile")
    
    print("\n✅ Customer model verification PASSED\n")


def verify_database_tables():
    """Verify database tables exist."""
    print("=" * 60)
    print("VERIFYING DATABASE TABLES")
    print("=" * 60)
    
    with connection.cursor() as cursor:
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        required_tables = ['alicetant_user', 'alicetant_provider', 'alicetant_customer']
        for table in required_tables:
            assert table in tables, f"Table {table} not found in database"
            print(f"✓ Table exists in database: {table}")
    
    print("\n✅ Database tables verification PASSED\n")


def main():
    """Run all verification checks."""
    print("\n" + "=" * 60)
    print("ALICETANT USER DATA MODEL SCHEMA VERIFICATION")
    print("=" * 60 + "\n")
    
    try:
        verify_user_model()
        verify_provider_model()
        verify_customer_model()
        verify_database_tables()
        
        print("=" * 60)
        print("🎉 ALL VERIFICATIONS PASSED!")
        print("=" * 60)
        print("\nDatabase schema matches design requirements:")
        print("  - User model with role differentiation")
        print("  - Provider profile with business information")
        print("  - Customer profile with booking information")
        print("  - Proper constraints and indexes")
        print("  - Cascade delete relationships")
        print("\n")
        
        return 0
        
    except AssertionError as e:
        print(f"\n❌ VERIFICATION FAILED: {e}\n")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}\n")
        return 1


if __name__ == '__main__':
    sys.exit(main())
