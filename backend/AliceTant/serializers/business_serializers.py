"""
Serializers for Business model.

This module provides serializers for creating, updating, and displaying
business information.
"""

from rest_framework import serializers
from AliceTant.models import Business


class BusinessSerializer(serializers.ModelSerializer):
    """
    Serializer for Business model.
    
    Handles serialization and deserialization of Business objects.
    The provider field is read-only and automatically set from the request user.
    
    Fields:
        id: Business ID (read-only)
        name: Business name (required)
        description: Business description (required)
        phone: Contact phone number (required)
        email: Contact email (required)
        address: Business address (required)
        created_at: Creation timestamp (read-only)
        updated_at: Last update timestamp (read-only)
    """
    
    class Meta:
        model = Business
        fields = [
            'id',
            'name',
            'description',
            'phone',
            'email',
            'address',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """
        Validate business name is not empty or whitespace only.
        
        Args:
            value (str): Business name to validate
            
        Returns:
            str: Validated business name
            
        Raises:
            serializers.ValidationError: If name is empty or whitespace only
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Business name cannot be empty")
        return value.strip()
    
    def validate_phone(self, value):
        """
        Validate phone number is not empty.
        
        Args:
            value (str): Phone number to validate
            
        Returns:
            str: Validated phone number
            
        Raises:
            serializers.ValidationError: If phone is empty
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number cannot be empty")
        return value.strip()
    
    def validate_email(self, value):
        """
        Validate email is not empty.
        
        Args:
            value (str): Email to validate
            
        Returns:
            str: Validated email
            
        Raises:
            serializers.ValidationError: If email is empty
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Email cannot be empty")
        return value.strip()
    
    def validate_address(self, value):
        """
        Validate address is not empty.
        
        Args:
            value (str): Address to validate
            
        Returns:
            str: Validated address
            
        Raises:
            serializers.ValidationError: If address is empty
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Address cannot be empty")
        return value.strip()
    
    def validate_description(self, value):
        """
        Validate description is not empty.
        
        Args:
            value (str): Description to validate
            
        Returns:
            str: Validated description
            
        Raises:
            serializers.ValidationError: If description is empty
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Description cannot be empty")
        return value.strip()
