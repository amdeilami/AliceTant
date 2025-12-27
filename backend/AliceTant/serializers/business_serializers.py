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
        summary: Business summary (optional, max 512 characters)
        logo: Business logo image file (optional)
        logo_url: URL to access the logo image (read-only)
        description: Business description (required)
        phone: Contact phone number (required)
        email: Contact email (required)
        address: Business address (required)
        provider_name: Name of the provider who owns this business (read-only)
        created_at: Creation timestamp (read-only)
        updated_at: Last update timestamp (read-only)
    """
    
    provider_name = serializers.CharField(source='provider.user.username', read_only=True)
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Business
        fields = [
            'id',
            'name',
            'summary',
            'logo',
            'logo_url',
            'description',
            'phone',
            'email',
            'address',
            'provider_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'provider_name', 'logo_url']
    
    def get_logo_url(self, obj):
        """
        Generate URL for the business logo.
        
        Args:
            obj (Business): Business instance
            
        Returns:
            str or None: URL to the logo image if it exists, None otherwise
        """
        if obj.logo and hasattr(obj.logo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
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
    
    def validate_summary(self, value):
        """
        Validate business summary does not exceed 512 characters.
        
        Args:
            value (str): Business summary to validate
            
        Returns:
            str: Validated business summary
            
        Raises:
            serializers.ValidationError: If summary exceeds 512 characters
        """
        if value and len(value) > 512:
            raise serializers.ValidationError("Summary must not exceed 512 characters")
        return value
    
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
