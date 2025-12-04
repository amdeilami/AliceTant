"""
Serializers for availability management.

This module contains serializers for creating, updating, and displaying
availability slots for provider businesses.
"""

from rest_framework import serializers
from AliceTant.models import Availability, Business


class AvailabilitySerializer(serializers.ModelSerializer):
    """
    Serializer for Availability model.
    
    Handles serialization and deserialization of availability slots,
    including validation of time ordering.
    """
    
    class Meta:
        model = Availability
        fields = ['id', 'business', 'day_of_week', 'start_time', 'end_time', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Validate that end_time is after start_time.
        
        Args:
            data (dict): Dictionary containing availability data
            
        Returns:
            dict: Validated data
            
        Raises:
            ValidationError: If end_time is not after start_time
        """
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })
        
        return data


class AvailabilityCreateSerializer(serializers.Serializer):
    """
    Serializer for creating multiple availability slots at once.
    
    Accepts a business_id and a list of availability slots to create.
    """
    
    business_id = serializers.IntegerField(required=True)
    slots = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        allow_empty=False
    )
    
    def validate_business_id(self, value):
        """
        Validate that the business exists and belongs to the current user.
        
        Args:
            value (int): Business ID
            
        Returns:
            int: Validated business ID
            
        Raises:
            ValidationError: If business doesn't exist or doesn't belong to user
        """
        user = self.context.get('request').user
        
        try:
            business = Business.objects.get(id=value)
        except Business.DoesNotExist:
            raise serializers.ValidationError("Business not found.")
        
        # Check if the business belongs to the current provider
        if business.provider.user != user:
            raise serializers.ValidationError("You don't have permission to manage this business.")
        
        return value
    
    def validate_slots(self, value):
        """
        Validate each slot in the list.
        
        Args:
            value (list): List of slot dictionaries
            
        Returns:
            list: Validated slots
            
        Raises:
            ValidationError: If any slot is invalid
        """
        for slot in value:
            # Validate required fields
            if 'day_of_week' not in slot:
                raise serializers.ValidationError("Each slot must have 'day_of_week'.")
            if 'start_time' not in slot:
                raise serializers.ValidationError("Each slot must have 'start_time'.")
            if 'end_time' not in slot:
                raise serializers.ValidationError("Each slot must have 'end_time'.")
            
            # Validate day_of_week range
            day = slot['day_of_week']
            if not isinstance(day, int) or day < 0 or day > 6:
                raise serializers.ValidationError("day_of_week must be an integer between 0 and 6.")
            
            # Validate time format (will be handled by TimeField)
            # Validate time ordering
            start_time = slot['start_time']
            end_time = slot['end_time']
            
            # Convert string times to time objects for comparison
            from datetime import datetime
            try:
                start = datetime.strptime(start_time, '%H:%M').time()
                end = datetime.strptime(end_time, '%H:%M').time()
                
                if end <= start:
                    raise serializers.ValidationError(
                        f"End time must be after start time for slot: {slot}"
                    )
            except ValueError:
                raise serializers.ValidationError(
                    "Time must be in HH:MM format (e.g., '09:00')."
                )
        
        return value
