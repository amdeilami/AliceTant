"""
Appointment repository for AliceTant application.

This module provides a repository layer that abstracts database operations
for appointment management, including CRUD operations, time slot validation,
and queries. It translates Django ORM exceptions into domain-specific exceptions.
"""

from typing import List, Optional
from datetime import date, time, datetime
from django.db import transaction, IntegrityError
from django.db.models import Q, Prefetch

from ..models import (
    Appointment,
    AppointmentCustomer,
    AppointmentStatus,
    Availability,
    Business,
    Customer,
    Provider
)
from ..exceptions.user_exceptions import (
    InvalidAppointmentDataError,
    TimeSlotConflictError,
    BusinessNotFoundError
)


class AppointmentRepository:
    """
    Repository for appointment data access operations.
    
    Abstracts database operations from business logic, providing a clean
    interface for appointment management. All methods are static as the repository
    maintains no state.
    """
    
    @staticmethod
    @transaction.atomic
    def create_appointment(
        business: Business,
        customers: List[Customer],
        appointment_date: date,
        appointment_time: time,
        end_time: time = None,
        availability: 'Availability' = None,
        notes: str = ""
    ) -> Appointment:
        """
        Create a new appointment with customers.

        Creates an appointment entity and links customers. When an availability slot
        is provided, validates capacity constraints (how many overlapping bookings
        are allowed in that slot on the given date).

        Args:
            business: Business where appointment is scheduled
            customers: List of customers for this appointment (min 1)
            appointment_date: Date of the appointment
            appointment_time: Start time of the appointment
            end_time: End time of the appointment (optional)
            availability: The availability slot being booked against (optional)
            notes: Optional notes about the appointment

        Returns:
            Appointment: The newly created appointment instance

        Raises:
            InvalidAppointmentDataError: If validation fails
            TimeSlotConflictError: If capacity is exceeded
        """
        if not customers or len(customers) == 0:
            raise InvalidAppointmentDataError("At least one customer is required for an appointment")

        appointment_datetime = datetime.combine(appointment_date, appointment_time)
        if appointment_datetime <= datetime.now():
            raise InvalidAppointmentDataError(
                f"Appointment date and time must be in the future "
                f"(got {appointment_date} {appointment_time})"
            )

        # Capacity check: count active overlapping bookings for this availability on this date
        if availability:
            max_capacity = availability.capacity or 1
            overlapping_count = AppointmentRepository.count_overlapping_bookings(
                availability=availability,
                appointment_date=appointment_date,
                start_time=appointment_time,
                end_time=end_time or appointment_time,
            )
            if overlapping_count >= max_capacity:
                raise TimeSlotConflictError(
                    f"This availability slot is fully booked for {appointment_date} "
                    f"(capacity: {max_capacity}, current bookings: {overlapping_count})"
                )

        try:
            appointment = Appointment.objects.create(
                business=business,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                end_time=end_time,
                availability=availability,
                status=AppointmentStatus.ACTIVE,
                notes=notes
            )

            for customer in customers:
                AppointmentCustomer.objects.create(
                    appointment=appointment,
                    customer=customer
                )

            appointment.refresh_from_db()
            return appointment

        except IntegrityError as e:
            raise InvalidAppointmentDataError(f"Database integrity error: {str(e)}")
        except Exception as e:
            raise InvalidAppointmentDataError(f"Failed to create appointment: {str(e)}")
    
    @staticmethod
    def get_appointment_by_id(appointment_id: int) -> Appointment:
        """
        Retrieve appointment by ID.
        
        Fetches the appointment with related business and customers for efficient access.
        
        Args:
            appointment_id (int): The ID of the appointment to retrieve
        
        Returns:
            Appointment: The appointment instance with the specified ID
        
        Raises:
            InvalidAppointmentDataError: If no appointment exists with the given ID
        """
        try:
            return Appointment.objects.select_related(
                'business',
                'business__provider__user'
            ).prefetch_related(
                'customers',
                'customers__user'
            ).get(id=appointment_id)
        except Appointment.DoesNotExist:
            raise InvalidAppointmentDataError(f"Appointment with ID {appointment_id} not found")
    
    @staticmethod
    def get_appointments_by_business(
        business: Business,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Appointment]:
        """
        Retrieve appointments for a business, optionally filtered by date range.
        
        Returns appointments ordered chronologically. If date range is provided,
        only appointments within that range are returned.
        
        Args:
            business (Business): The business whose appointments to retrieve
            start_date (date, optional): Start date for filtering (inclusive)
            end_date (date, optional): End date for filtering (inclusive)
        
        Returns:
            List[Appointment]: List of appointments for the business, ordered by date/time
        """
        queryset = Appointment.objects.filter(
            business=business
        ).select_related(
            'business',
            'business__provider__user'
        ).prefetch_related(
            'customers',
            'customers__user'
        )
        
        # Apply date range filters if provided
        if start_date:
            queryset = queryset.filter(appointment_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(appointment_date__lte=end_date)
        
        return list(queryset.order_by('appointment_date', 'appointment_time'))
    
    @staticmethod
    def get_appointments_by_customer(customer: Customer) -> List[Appointment]:
        """
        Retrieve all appointments for a customer.
        
        Returns appointments where the customer is linked, ordered chronologically.
        
        Args:
            customer (Customer): The customer whose appointments to retrieve
        
        Returns:
            List[Appointment]: List of appointments for the customer, ordered by date/time
        """
        return list(
            Appointment.objects.filter(
                customers=customer
            ).select_related(
                'business',
                'business__provider__user'
            ).prefetch_related(
                'customers',
                'customers__user'
            ).order_by('appointment_date', 'appointment_time')
        )
    
    @staticmethod
    def get_appointments_by_provider(provider: Provider) -> List[Appointment]:
        """
        Retrieve all appointments for businesses owned by a provider.
        
        Returns appointments for all businesses belonging to the provider,
        ordered chronologically.
        
        Args:
            provider (Provider): The provider whose appointments to retrieve
        
        Returns:
            List[Appointment]: List of appointments for provider's businesses, ordered by date/time
        """
        return list(
            Appointment.objects.filter(
                business__provider=provider
            ).select_related(
                'business',
                'business__provider__user'
            ).prefetch_related(
                'customers',
                'customers__user'
            ).order_by('appointment_date', 'appointment_time')
        )
    
    @staticmethod
    def cancel_appointment(appointment_id: int) -> Appointment:
        """
        Cancel an appointment (soft delete).
        
        Changes the appointment status to CANCELLED rather than deleting the record,
        preserving history for both providers and customers.
        
        Args:
            appointment_id (int): The ID of the appointment to cancel
        
        Returns:
            Appointment: The cancelled appointment instance
        
        Raises:
            InvalidAppointmentDataError: If appointment not found or already cancelled
        """
        try:
            appointment = Appointment.objects.select_related(
                'business',
                'business__provider__user'
            ).prefetch_related(
                'customers',
                'customers__user'
            ).get(id=appointment_id)
        except Appointment.DoesNotExist:
            raise InvalidAppointmentDataError(f"Appointment with ID {appointment_id} not found")
        
        # Check if already cancelled
        if appointment.status == AppointmentStatus.CANCELLED:
            raise InvalidAppointmentDataError(
                f"Appointment {appointment_id} is already cancelled"
            )
        
        # Update status to cancelled
        appointment.status = AppointmentStatus.CANCELLED
        appointment.save()
        
        return appointment
    
    @staticmethod
    def count_overlapping_bookings(
        availability: 'Availability',
        appointment_date: date,
        start_time: time,
        end_time: time,
        exclude_appointment_id: int = None,
    ) -> int:
        """
        Count how many ACTIVE appointments overlap with the given time range
        on a specific date for a given availability slot.

        Two bookings overlap if one starts before the other ends and
        ends after the other starts.
        """
        qs = Appointment.objects.filter(
            availability=availability,
            appointment_date=appointment_date,
            status=AppointmentStatus.ACTIVE,
        )
        if exclude_appointment_id:
            qs = qs.exclude(id=exclude_appointment_id)

        count = 0
        for appt in qs:
            appt_end = appt.end_time or appt.appointment_time
            booking_end = end_time or start_time
            # overlap: starts before other ends AND ends after other starts
            if appt.appointment_time < booking_end and appt_end > start_time:
                count += 1
        return count

    @staticmethod
    def check_time_slot_available(
        business: Business,
        appointment_date: date,
        appointment_time: time
    ) -> bool:
        """
        Legacy check — returns True if no exact-match active appointment exists.
        Kept for backward compatibility; new code should use count_overlapping_bookings.
        """
        return not Appointment.objects.filter(
            business=business,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            status=AppointmentStatus.ACTIVE
        ).exists()
