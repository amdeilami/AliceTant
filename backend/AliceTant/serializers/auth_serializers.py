"""
Authentication serializers for AliceTant API.

This module contains Django REST Framework serializers for user authentication
endpoints including signup, login, and user data formatting.
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from AliceTant.models import User, UserRole


class SignupSerializer(serializers.Serializer):
    """
    Serializer for user registration (signup) requests.
    
    Validates signup data including full name, email, phone number, password,
    and role. Ensures email uniqueness and password strength.
    
    Fields:
        full_name (str): User's full name (2-64 characters, required)
        email (str): User's email address (valid email format, required, unique)
        phone_number (str): User's phone number (optional, can be null/empty)
        password (str): User's password (min 8 characters, required, write-only)
        role (str): User's role - 'customer' or 'provider' (required)
    """
    
    full_name = serializers.CharField(
        required=True,
        min_length=2,
        max_length=64,
        help_text="User's full name (2-64 characters)"
    )
    
    email = serializers.EmailField(
        required=True,
        help_text="User's email address (must be unique)"
    )
    
    phone_number = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=20,
        help_text="User's phone number (optional)"
    )
    
    password = serializers.CharField(
        required=True,
        min_length=8,
        write_only=True,
        style={'input_type': 'password'},
        help_text="User's password (minimum 8 characters)"
    )
    
    role = serializers.ChoiceField(
        choices=['customer', 'provider'],
        required=True,
        help_text="User's role - 'customer' or 'provider'"
    )
    
    def validate_email(self, value):
        """
        Validate email uniqueness.
        
        Args:
            value (str): Email address to validate
            
        Returns:
            str: Validated email address
            
        Raises:
            serializers.ValidationError: If email already exists
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                f"User with email '{value}' already exists"
            )
        return value.lower()
    
    def validate_password(self, value):
        """
        Validate password strength using Django's password validators.
        
        Args:
            value (str): Password to validate
            
        Returns:
            str: Validated password
            
        Raises:
            serializers.ValidationError: If password doesn't meet requirements
        """
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate_role(self, value):
        """
        Normalize role to uppercase format matching UserRole enum.
        
        Args:
            value (str): Role value ('customer' or 'provider')
            
        Returns:
            str: Normalized role ('CUSTOMER' or 'PROVIDER')
        """
        return value.upper()
    
    def validate_full_name(self, value):
        """
        Validate full name is not empty or just whitespace.
        
        Args:
            value (str): Full name to validate
            
        Returns:
            str: Validated and stripped full name
            
        Raises:
            serializers.ValidationError: If full name is empty or whitespace
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Full name cannot be empty")
        return value.strip()


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login (authentication) requests.
    
    Validates login credentials including email and password.
    
    Fields:
        email (str): User's email address (required)
        password (str): User's password (required, write-only)
    """
    
    email = serializers.EmailField(
        required=True,
        help_text="User's email address"
    )
    
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="User's password"
    )
    
    def validate_email(self, value):
        """
        Normalize email to lowercase.
        
        Args:
            value (str): Email address
            
        Returns:
            str: Lowercase email address
        """
        return value.lower()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user data in API responses.
    
    Formats user data for API responses, excluding sensitive information
    like passwords. All fields are read-only.
    
    Fields:
        id (int): User's unique identifier
        username (str): User's username
        email (str): User's email address
        role (str): User's role (CUSTOMER or PROVIDER)
        full_name (str): User's full name (from first_name and last_name)
        created_at (datetime): When the user account was created
    """
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'full_name', 'created_at']
        read_only_fields = ['id', 'username', 'email', 'role', 'full_name', 'created_at']
    
    def get_full_name(self, obj):
        """
        Get user's full name from related Customer or Provider profile.
        
        For customers, returns the full_name from Customer profile.
        For providers, returns the business_name from Provider profile.
        Falls back to first_name and last_name if profiles don't exist.
        
        Args:
            obj (User): User instance
            
        Returns:
            str: Full name or empty string if not set
        """
        try:
            if obj.role == 'CUSTOMER' and hasattr(obj, 'customer_profile'):
                return obj.customer_profile.full_name
            elif obj.role == 'PROVIDER' and hasattr(obj, 'provider_profile'):
                return obj.provider_profile.business_name
        except Exception:
            pass
        
        # Fallback to first_name and last_name
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        elif obj.first_name:
            return obj.first_name
        elif obj.last_name:
            return obj.last_name
        return ""
