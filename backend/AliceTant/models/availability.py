"""
Availability model for AliceTant application.

This module defines the Availability model which represents time slots
when a provider is available for appointments at a specific business.
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .business import Business


class Availability(models.Model):
    """
    Availability model representing time slots when a provider is available.
    
    Each availability slot is associated with a specific business and defines
    a time window on a specific date when the provider accepts appointments.
    Slots can be created as recurring (weekly) via recurring_group.
    
    Attributes:
        business (Business): Foreign key to the Business this availability applies to
        date (date): The specific date this availability is for
        day_of_week (int): Day of week (0=Sunday, 1=Monday, ..., 6=Saturday), auto-derived from date
        start_time (time): Start time of the availability window
        end_time (time): End time of the availability window
        capacity (int): Max concurrent bookings (NULL means 1)
        recurring_group (UUID): Groups recurring slots created together (nullable)
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

    # Maps Python's weekday() (Mon=0) to our scheme (Sun=0)
    _PY_WEEKDAY_MAP = {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0}
    
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='availability_slots',
        help_text="Business this availability applies to"
    )
    date = models.DateField(
        help_text="The specific date this availability is for"
    )
    day_of_week = models.IntegerField(
        choices=DAY_CHOICES,
        validators=[MinValueValidator(0), MaxValueValidator(6)],
        help_text="Day of week (0=Sunday, 6=Saturday), auto-derived from date"
    )
    start_time = models.TimeField(
        help_text="Start time of availability window"
    )
    end_time = models.TimeField(
        help_text="End time of availability window"
    )
    capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Max concurrent bookings. NULL means 1 (single booking at a time)."
    )
    recurring_group = models.UUIDField(
        null=True,
        blank=True,
        help_text="Groups recurring slots created together. NULL for one-off slots."
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
        ordering = ['date', 'start_time']
        unique_together = ['business', 'date', 'start_time']
    
    def __str__(self):
        day_name = dict(self.DAY_CHOICES)[self.day_of_week]
        return f"{self.business.name} - {self.date} ({day_name}) {self.start_time}-{self.end_time}"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValidationError({
                'end_time': 'End time must be after start time.'
            })
    
    def save(self, *args, **kwargs):
        # Auto-derive day_of_week from date
        if self.date:
            self.day_of_week = self._PY_WEEKDAY_MAP[self.date.weekday()]
        self.clean()
        super().save(*args, **kwargs)
