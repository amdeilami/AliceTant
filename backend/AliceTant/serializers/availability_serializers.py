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
    """
    
    class Meta:
        model = Availability
        fields = [
            'id', 'business', 'date', 'day_of_week', 'start_time', 'end_time',
            'capacity', 'recurring_group', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'day_of_week', 'created_at', 'updated_at']
    
    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })
        
        return data


class AvailabilityCreateSerializer(serializers.Serializer):
    """
    Serializer for creating availability slots (single or recurring).

    Accepts a business_id and a list of slot definitions. Each slot has a
    date, start_time, end_time, optional capacity, and optional recurring
    config (is_recurring + num_weeks, max 64).
    """
    
    business_id = serializers.IntegerField(required=True)
    slots = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        allow_empty=False
    )
    
    def validate_business_id(self, value):
        user = self.context.get('request').user
        
        try:
            business = Business.objects.get(id=value)
        except Business.DoesNotExist:
            raise serializers.ValidationError("Business not found.")
        
        if business.provider.user != user:
            raise serializers.ValidationError("You don't have permission to manage this business.")
        
        return value
    
    def validate_slots(self, value):
        from datetime import datetime, date, timedelta
        from collections import defaultdict

        today = date.today()

        for slot in value:
            # Required fields
            if 'date' not in slot:
                raise serializers.ValidationError("Each slot must have 'date'.")
            if 'start_time' not in slot:
                raise serializers.ValidationError("Each slot must have 'start_time'.")
            if 'end_time' not in slot:
                raise serializers.ValidationError("Each slot must have 'end_time'.")

            # Validate date
            try:
                slot_date = datetime.strptime(slot['date'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    "Date must be in YYYY-MM-DD format."
                )
            if slot_date < today:
                raise serializers.ValidationError(
                    f"Date {slot['date']} is in the past."
                )

            # Validate times
            start_time = slot['start_time']
            end_time = slot['end_time']
            try:
                start = datetime.strptime(start_time, '%H:%M').time()
                end = datetime.strptime(end_time, '%H:%M').time()
                if end <= start:
                    raise serializers.ValidationError(
                        f"End time must be after start time for slot on {slot['date']}."
                    )
            except ValueError:
                raise serializers.ValidationError(
                    "Time must be in HH:MM format (e.g., '09:00')."
                )

            # Validate optional capacity
            capacity = slot.get('capacity')
            if capacity is not None:
                try:
                    capacity = int(capacity)
                    if capacity < 1:
                        raise serializers.ValidationError("Capacity must be at least 1.")
                except (ValueError, TypeError):
                    raise serializers.ValidationError("Capacity must be a positive integer.")

            # Validate recurring options
            is_recurring = slot.get('is_recurring', False)
            if is_recurring:
                num_weeks = slot.get('num_weeks', 1)
                try:
                    num_weeks = int(num_weeks)
                except (ValueError, TypeError):
                    raise serializers.ValidationError("num_weeks must be an integer.")
                if num_weeks < 1 or num_weeks > 64:
                    raise serializers.ValidationError(
                        "num_weeks must be between 1 and 64."
                    )

        # Expand recurring slots into individual dates for overlap checking
        all_date_slots = defaultdict(list)
        for slot in value:
            slot_date = datetime.strptime(slot['date'], '%Y-%m-%d').date()
            start = datetime.strptime(slot['start_time'], '%H:%M').time()
            end = datetime.strptime(slot['end_time'], '%H:%M').time()

            is_recurring = slot.get('is_recurring', False)
            num_weeks = int(slot.get('num_weeks', 1)) if is_recurring else 1

            for w in range(num_weeks):
                d = slot_date + timedelta(weeks=w)
                all_date_slots[d].append((start, end))

        # Check for overlaps within the new set
        for d, times in all_date_slots.items():
            times.sort()
            for i in range(len(times) - 1):
                if times[i][1] > times[i + 1][0]:
                    raise serializers.ValidationError(
                        f"Overlapping time slots on {d.isoformat()}: "
                        f"{times[i][0].strftime('%H:%M')}-{times[i][1].strftime('%H:%M')} "
                        f"overlaps with {times[i+1][0].strftime('%H:%M')}-{times[i+1][1].strftime('%H:%M')}."
                    )

        return value
