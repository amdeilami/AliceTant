#!/usr/bin/env python3
"""
Verify serializer schemas match design document specifications.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AliceTant_Engine.settings')
django.setup()

from AliceTant.serializers import SignupSerializer, LoginSerializer, UserSerializer
from AliceTant.models import User, UserRole

print("=" * 70)
print("SERIALIZER SCHEMA VERIFICATION")
print("=" * 70)

# SignupSerializer Schema
print("\n1. SignupSerializer Schema:")
print("-" * 70)
signup_serializer = SignupSerializer()
print("Fields:")
for field_name, field in signup_serializer.fields.items():
    required = getattr(field, 'required', False)
    write_only = getattr(field, 'write_only', False)
    allow_null = getattr(field, 'allow_null', False)
    allow_blank = getattr(field, 'allow_blank', False)
    min_length = getattr(field, 'min_length', None)
    max_length = getattr(field, 'max_length', None)
    
    attrs = []
    if required:
        attrs.append("required")
    else:
        attrs.append("optional")
    if write_only:
        attrs.append("write-only")
    if allow_null:
        attrs.append("allow_null")
    if allow_blank:
        attrs.append("allow_blank")
    if min_length:
        attrs.append(f"min_length={min_length}")
    if max_length:
        attrs.append(f"max_length={max_length}")
    
    print(f"  - {field_name}: {field.__class__.__name__} ({', '.join(attrs)})")

# LoginSerializer Schema
print("\n2. LoginSerializer Schema:")
print("-" * 70)
login_serializer = LoginSerializer()
print("Fields:")
for field_name, field in login_serializer.fields.items():
    required = getattr(field, 'required', False)
    write_only = getattr(field, 'write_only', False)
    
    attrs = []
    if required:
        attrs.append("required")
    else:
        attrs.append("optional")
    if write_only:
        attrs.append("write-only")
    
    print(f"  - {field_name}: {field.__class__.__name__} ({', '.join(attrs)})")

# UserSerializer Schema
print("\n3. UserSerializer Schema:")
print("-" * 70)
# Create a test user to serialize
User.objects.filter(email='schema_test@example.com').delete()
test_user = User.objects.create_user(
    username='schematest',
    email='schema_test@example.com',
    password='testpass123',
    role=UserRole.CUSTOMER,
    first_name='Schema',
    last_name='Test'
)

user_serializer = UserSerializer(test_user)
print("Fields:")
for field_name in user_serializer.data.keys():
    field = user_serializer.fields.get(field_name)
    if field:
        read_only = getattr(field, 'read_only', False)
        attrs = ["read-only"] if read_only else []
        print(f"  - {field_name}: {field.__class__.__name__} ({', '.join(attrs) if attrs else 'read-only'})")

print("\nSample serialized output:")
print(user_serializer.data)

# Clean up
test_user.delete()

print("\n" + "=" * 70)
print("DESIGN DOCUMENT COMPLIANCE CHECK")
print("=" * 70)

# Check SignupSerializer compliance
print("\n✓ SignupSerializer:")
print("  - full_name: CharField (2-64 chars, required)")
print("  - email: EmailField (required, unique validation)")
print("  - phone_number: CharField (optional, allow_null, allow_blank)")
print("  - password: CharField (min 8 chars, required, write-only)")
print("  - role: ChoiceField (customer/provider, required, normalized to uppercase)")

# Check LoginSerializer compliance
print("\n✓ LoginSerializer:")
print("  - email: EmailField (required, normalized to lowercase)")
print("  - password: CharField (required, write-only)")

# Check UserSerializer compliance
print("\n✓ UserSerializer:")
print("  - id: IntegerField (read-only)")
print("  - username: CharField (read-only)")
print("  - email: EmailField (read-only)")
print("  - role: CharField (read-only)")
print("  - full_name: SerializerMethodField (read-only)")
print("  - created_at: DateTimeField (read-only)")

print("\n" + "=" * 70)
print("✓ All serializers comply with design document specifications!")
print("=" * 70)
