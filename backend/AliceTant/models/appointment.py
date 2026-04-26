"""
Appointment models for AliceTant application.

This module defines the Appointment, AppointmentCustomer, and PendingModification
models which handle appointment scheduling between customers and businesses.
"""

import random

from django.db import models
from django.utils import timezone
from datetime import datetime
from .business import Business
from .customer import Customer
from .availability import Availability


class AppointmentStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    CANCELLED = 'CANCELLED', 'Cancelled'
    PENDING_MODIFICATION = 'PENDING_MOD', 'Pending Modification'


class Appointment(models.Model):
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='appointments',
    )
    customers = models.ManyToManyField(
        Customer,
        through='AppointmentCustomer',
        related_name='appointments',
    )
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    availability = models.ForeignKey(
        Availability,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings',
    )
    status = models.CharField(
        max_length=12,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.ACTIVE,
    )
    reference_id = models.PositiveIntegerField(
        unique=True,
        editable=False,
        null=True,
        help_text="Unique 8-digit reference ID for display"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference_id:
            self.reference_id = self._generate_unique_reference_id()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_unique_reference_id():
        while True:
            ref_id = random.randint(10000000, 99999999)
            if not Appointment.objects.filter(reference_id=ref_id).exists():
                return ref_id

    class Meta:
        db_table = 'alicetant_appointment'
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'
        ordering = ['appointment_date', 'appointment_time']
        indexes = [
            models.Index(fields=['business', 'appointment_date', 'appointment_time']),
            models.Index(fields=['appointment_date', 'status']),
            models.Index(fields=['availability', 'appointment_date', 'status']),
        ]

    def is_upcoming(self):
        appointment_datetime = datetime.combine(self.appointment_date, self.appointment_time)
        return appointment_datetime > datetime.now() and self.status == AppointmentStatus.ACTIVE

    def __str__(self):
        return f"{self.business.name} - {self.appointment_date} {self.appointment_time} ({self.status})"


class PendingModification(models.Model):
    """Stores proposed changes to an appointment that require confirmation."""

    class ProposedBy(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        PROVIDER = 'PROVIDER', 'Provider'

    class ModificationStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='pending_modifications',
    )
    proposed_by = models.CharField(max_length=10, choices=ProposedBy.choices)
    proposed_by_user_id = models.IntegerField(
        help_text="User ID of whoever proposed the change"
    )
    new_date = models.DateField()
    new_time = models.TimeField()
    new_end_time = models.TimeField(null=True, blank=True)
    new_notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=10,
        choices=ModificationStatus.choices,
        default=ModificationStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'alicetant_pending_modification'
        ordering = ['-created_at']

    def __str__(self):
        return f"Modification #{self.id} for Appointment #{self.appointment_id} ({self.status})"


class AppointmentCustomer(models.Model):
    """
    Through model for Appointment-Customer many-to-many relationship.
    
    Links customers to appointments and tracks when they joined the appointment.
    
    Attributes:
        appointment (Appointment): Foreign key to the Appointment
        customer (Customer): Foreign key to the Customer
        joined_at (datetime): Timestamp when customer was added to appointment
    """
    
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        help_text="Appointment being linked"
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        help_text="Customer being linked"
    )
    joined_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when customer was added to appointment"
    )
    
    class Meta:
        db_table = 'alicetant_appointment_customer'
        verbose_name = 'Appointment Customer'
        verbose_name_plural = 'Appointment Customers'
        unique_together = ['appointment', 'customer']
    
    def __str__(self):
        """
        String representation of the AppointmentCustomer.
        
        Returns:
            str: Customer name and appointment details
        """
        return f"{self.customer.full_name} - {self.appointment}"
