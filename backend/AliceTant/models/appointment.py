"""
Appointment models for AliceTant application.

This module defines the Appointment and AppointmentCustomer models which
handle appointment scheduling between customers and businesses.
"""

from django.db import models
from django.utils import timezone
from datetime import datetime
from .business import Business
from .customer import Customer


class AppointmentStatus(models.TextChoices):
    """
    Enumeration of possible appointment statuses.
    
    Attributes:
        ACTIVE: Appointment is scheduled and active
        CANCELLED: Appointment has been cancelled (soft delete)
    """
    ACTIVE = 'ACTIVE', 'Active'
    CANCELLED = 'CANCELLED', 'Cancelled'


class Appointment(models.Model):
    """
    Appointment model representing a scheduled booking.
    
    Connects one or more customers with a specific business at a scheduled
    date and time. Supports soft deletion through status field.
    
    Attributes:
        business (Business): Foreign key to the Business being booked
        customers (ManyToManyField): Customers associated with this appointment
        appointment_date (date): Date of the appointment
        appointment_time (time): Time of the appointment
        status (str): Current status (ACTIVE or CANCELLED)
        notes (str): Optional notes about the appointment
        created_at (datetime): Timestamp when appointment was created
        updated_at (datetime): Timestamp when appointment was last updated
    """
    
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='appointments',
        help_text="Business where the appointment is scheduled"
    )
    customers = models.ManyToManyField(
        Customer,
        through='AppointmentCustomer',
        related_name='appointments',
        help_text="Customers associated with this appointment"
    )
    appointment_date = models.DateField(
        help_text="Date of the appointment"
    )
    appointment_time = models.TimeField(
        help_text="Time of the appointment"
    )
    status = models.CharField(
        max_length=10,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.ACTIVE,
        help_text="Current status of the appointment"
    )
    notes = models.TextField(
        blank=True,
        help_text="Optional notes about the appointment"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when appointment was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when appointment was last updated"
    )
    
    class Meta:
        db_table = 'alicetant_appointment'
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'
        ordering = ['appointment_date', 'appointment_time']
        indexes = [
            models.Index(fields=['business', 'appointment_date', 'appointment_time']),
            models.Index(fields=['appointment_date', 'status']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['business', 'appointment_date', 'appointment_time'],
                condition=models.Q(status='ACTIVE'),
                name='unique_active_appointment_slot'
            )
        ]
    
    def is_upcoming(self):
        """
        Check if appointment is in the future and active.
        
        Returns:
            bool: True if appointment is upcoming and active, False otherwise
        """
        appointment_datetime = datetime.combine(
            self.appointment_date,
            self.appointment_time
        )
        now = datetime.now()
        return appointment_datetime > now and self.status == AppointmentStatus.ACTIVE
    
    def __str__(self):
        """
        String representation of the Appointment.
        
        Returns:
            str: Business name, date, time, and status
        """
        return f"{self.business.name} - {self.appointment_date} {self.appointment_time} ({self.status})"


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
