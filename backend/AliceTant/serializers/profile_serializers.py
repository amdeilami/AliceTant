"""
Profile management serializers for AliceTant application.

This module provides serializers for profile update operations including
email updates, password changes, and avatar uploads.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from ..models.user import User


class EmailUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating user email address.
    
    Validates email format and ensures uniqueness.
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """
        Validate that email is unique (excluding current user).
        
        Args:
            value (str): Email address to validate
        
        Returns:
            str: Validated email address
        
        Raises:
            serializers.ValidationError: If email already exists
        """
        # Normalize email to lowercase
        value = value.lower().strip()
        
        # Check if email already exists (excluding current user)
        user = self.context.get('user')
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError('This email address is already in use.')
        
        return value


class PasswordUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating user password.
    
    Validates current password, new password strength, and confirmation match.
    """
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)
    
    def validate_current_password(self, value):
        """
        Validate that current password is correct.
        
        Args:
            value (str): Current password
        
        Returns:
            str: Validated current password
        
        Raises:
            serializers.ValidationError: If current password is incorrect
        """
        user = self.context.get('user')
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        
        return value
    
    def validate_new_password(self, value):
        """
        Validate new password using Django's password validators.
        
        Args:
            value (str): New password
        
        Returns:
            str: Validated new password
        
        Raises:
            serializers.ValidationError: If password doesn't meet requirements
        """
        user = self.context.get('user')
        
        try:
            validate_password(value, user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        
        return value
    
    def validate(self, data):
        """
        Validate that new password and confirmation match.
        
        Args:
            data (dict): All validated field data
        
        Returns:
            dict: Validated data
        
        Raises:
            serializers.ValidationError: If passwords don't match
        """
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Password confirmation does not match.'
            })
        
        return data


class AvatarUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating user avatar image.
    
    Validates file type and size.
    """
    avatar = serializers.ImageField(required=True)
    
    def validate_avatar(self, value):
        """
        Validate avatar file type and size.
        
        Args:
            value (File): Uploaded avatar file
        
        Returns:
            File: Validated avatar file
        
        Raises:
            serializers.ValidationError: If file is invalid
        """
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError('Avatar file size must be less than 5MB.')
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                'Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP.'
            )
        
        return value
