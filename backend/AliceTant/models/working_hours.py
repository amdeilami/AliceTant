"""
Working Hours and Business Closure models for AliceTant application.

WorkingHours: Recurring weekly schedule for when a business is open.
BusinessClosure: One-off closures (holidays, vacations, etc.) that override working hours
and automatically cancel overlapping appointments and availability.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .business import Business


class WorkingHours(models.Model):
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
        related_name='working_hours',
    )
    day_of_week = models.IntegerField(
        choices=DAY_CHOICES,
        validators=[MinValueValidator(0), MaxValueValidator(6)],
    )
    open_time = models.TimeField()
    close_time = models.TimeField()
    is_closed = models.BooleanField(
        default=False,
        help_text="If True, the business is closed all day on this day."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'alicetant_working_hours'
        verbose_name = 'Working Hours'
        verbose_name_plural = 'Working Hours'
        ordering = ['day_of_week', 'open_time']
        unique_together = ['business', 'day_of_week']

    def __str__(self):
        day_name = dict(self.DAY_CHOICES)[self.day_of_week]
        if self.is_closed:
            return f"{self.business.name} - {day_name}: CLOSED"
        return f"{self.business.name} - {day_name} {self.open_time}-{self.close_time}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.is_closed and self.open_time and self.close_time:
            if self.close_time <= self.open_time:
                raise ValidationError({'close_time': 'Close time must be after open time.'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class BusinessClosure(models.Model):
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='closures',
    )
    title = models.CharField(max_length=200, default='Untitled', blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alicetant_business_closure'
        verbose_name = 'Business Closure'
        verbose_name_plural = 'Business Closures'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.business.name} closed {self.start_date} to {self.end_date}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValidationError({'end_date': 'End date must be on or after start date.'})

    def save(self, *args, **kwargs):
        self.clean()
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self._cancel_overlapping()

    def _cancel_overlapping(self):
        """Cancel all ACTIVE appointments and delete availability slots that fall within this closure."""
        from .appointment import Appointment, AppointmentStatus
        from .availability import Availability

        # Cancel appointments in the closure date range
        Appointment.objects.filter(
            business=self.business,
            status=AppointmentStatus.ACTIVE,
            appointment_date__gte=self.start_date,
            appointment_date__lte=self.end_date,
        ).update(status=AppointmentStatus.CANCELLED)

        # For availability: availability is recurring (day_of_week based),
        # so we don't delete them. The closure dates take precedence at query time.
        # However, if the user wants to explicitly remove availability slots
        # for single-day closures that match a day_of_week, we leave that to
        # the business logic layer.
