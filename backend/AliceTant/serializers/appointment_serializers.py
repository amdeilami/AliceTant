"""
Serializers for Appointment model.

This module provides serializers for creating, updating, and displaying
appointment information.
"""

from rest_framework import serializers
from datetime import datetime, date
from AliceTant.models import Appointment, Customer


class AppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Appointment model.
    
    Handles serialization and deserialization of Appointment objects.
    Includes read-only fields for business name and customer names.
    
    Fields:
        id: Appointment ID (read-only)
        business: Business ID (required for creation)
        business_name: Name of the business (read-only)
        customers: List of customer IDs (required for creation)
        customer_names: List of customer names (read-only)
        appointment_date: Date of the appointment (required)
        appointment_time: Time of the appointment (required)
        status: Appointment status (read-only, managed by system)
        notes: Optional notes about the appointment
        is_upcoming: Whether appointment is in the future (read-only)
        created_at: Creation timestamp (read-only)
        updated_at: Last update timestamp (read-only)
    """
    
    business_name = serializers.CharField(source='business.name', read_only=True)
    customer_names = serializers.SerializerMethodField()
    is_upcoming = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id',
            'business',
            'business_name',
            'customers',
            'customer_names',
            'appointment_date',
            'appointment_time',
            'status',
            'notes',
            'is_upcoming',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'status',
            'business_name',
            'customer_names',
            'is_upcoming',
            'created_at',
            'updated_at'
        ]
    
    def get_customer_names(self, obj):
        """
        Get list of customer names for this appointment.
        
        Args:
            obj (Appointment): Appointment instance
            
        Returns:
            list: List of customer full names
        """
        return [customer.full_name for customer in obj.customers.all()]
    
    def get_is_upcoming(self, obj):
        """
        Check if appointment is upcoming.
        
        Args:
            obj (Appointment): Appointment instance
            
        Returns:
            bool: True if appointment is in the future and active
        """
        return obj.is_upcoming()
    
    def validate_appointment_date(self, value):
        """
        Validate that appointment date is in the future.
        
        Args:
            value (date): Appointment date to validate
            
        Returns:
            date: Validated appointment date
            
        Raises:
            serializers.ValidationError: If date is in the past
        """
        if value < date.today():
            raise serializers.ValidationError("Appointment date must be in the future")
        return value
    
    def validate_customers(self, value):
        """
        Validate that at least one customer is provided.
        
        Args:
            value (list): List of customer instances
            
        Returns:
            list: Validated list of customers
            
        Raises:
            serializers.ValidationError: If no customers provided
        """
        if not value:
            raise serializers.ValidationError("At least one customer is required for an appointment")
        return value
    
    def validate(self, attrs):
        """
        Perform cross-field validation.
        
        Args:
            attrs (dict): Dictionary of field values
            
        Returns:
            dict: Validated attributes
            
        Raises:
            serializers.ValidationError: If validation fails
        """
        appointment_date = attrs.get('appointment_date')
        appointment_time = attrs.get('appointment_time')
        
        # If both date and time are provided, validate the combined datetime is in the future
        if appointment_date and appointment_time:
            appointment_datetime = datetime.combine(appointment_date, appointment_time)
            if appointment_datetime <= datetime.now():
                raise serializers.ValidationError(
                    "Appointment date and time must be in the future"
                )
        
        return attrs