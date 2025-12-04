"""
Availability model for AliceTant application.

This module defines the Availability model which represents time slots
when a provider is available for appointments at a specific business.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .business import Business


class Availability(models.Model):
    """
    Availability model representing time slots when a provider is available.
    
    Each availability slot is associated with a specific business and defines
    a recurring time window (day of week, start time, end time) when the
    provider accepts appointments.
    
    Attributes:
        business (Business): Foreign key to the Business this availability applies to
        day_of_week (int): Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
        start_time (time): Start time of the availability window
        end_time (time): End time of the availability window
        created_at (datetime): Timestamp when the availability was created
        updated_at (datetime): Timestamp when the availability was last updated
    """
    
    SUNDAY = 0
    MONDAY = 1
    TUESDAY = 2
    WEDNESDAY = 3
    THURSDAY = 4
    FRIDAY = 5
    SATURDAY = 6
    
    DAY_CHOICES = [
        (SUNDAY, 'Sunday'),
        (MONDAY, 'Monday'),
        (TUESDAY, 'Tuesday'),
        (WEDNESDAY, 'Wednesday'),
        (THURSDAY, 'Thursday'),
        (FRIDAY, 'Friday'),
        (SATURDAY, 'Saturday'),
    ]
    
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='availability_slots',
        help_text="Business this availability applies to"
    )
    day_of_week = models.IntegerField(
        choices=DAY_CHOICES,
        validators=[MinValueValidator(0), MaxValueValidator(6)],
        help_text="Day of week (0=Sunday, 6=Saturday)"
    )
    start_time = models.TimeField(
        help_text="Start time of availability window"
    )
    end_time = models.TimeField(
        help_text="End time of availability window"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the availability was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the availability was last updated"
    )
    
    class Meta:
        db_table = 'alicetant_availability'
        verbose_name = 'Availability'
        verbose_name_plural = 'Availabilities'
        ordering = ['day_of_week', 'start_time']
        unique_together = ['business', 'day_of_week', 'start_time']
    
    def __str__(self):
        """
        String representation of the Availability.
        
        Returns:
            str: Business name, day, and time range
        """
        day_name = dict(self.DAY_CHOICES)[self.day_of_week]
        return f"{self.business.name} - {day_name} {self.start_time}-{self.end_time}"
    
    def clean(self):
        """
        Validate that end_time is after start_time.
        
        Raises:
            ValidationError: If end_time is not after start_time
        """
        from django.core.exceptions import ValidationError
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValidationError({
                'end_time': 'End time must be after start time.'
            })
    
    def save(self, *args, **kwargs):
        """
        Override save to call clean() for validation.
        """
        self.clean()
        super().save(*args, **kwargs)
