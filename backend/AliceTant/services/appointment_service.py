"""
Appointment service for AliceTant application.

This module provides the service layer for appointment operations, implementing
business logic, authorization checks, and validation. It acts as an intermediary
between the API layer and the repository layer.
"""

from typing import List, Dict, Optional
from datetime import date, time, datetime

from ..models import Appointment, Business, Customer, Provider
from ..repositories.appointment_repository import AppointmentRepository
from ..repositories.business_repository import BusinessRepository
from ..exceptions.user_exceptions import (
    InvalidAppointmentDataError,
    TimeSlotConflictError,
    BusinessNotFoundError,
    UnauthorizedAccessError
)


class AppointmentService:
    """
    Service layer for appointment operations with validation.
    
    Provides business logic and authorization for appointment management operations.
    All appointment operations go through this service to ensure proper validation
    and authorization before delegating to the repository layer.
    """
    
    @staticmethod
    def book_appointment(
        business_id: int,
        customer_ids: List[int],
        appointment_date: date,
        appointment_time: time,
        notes: str = ""
    ) -> Appointment:
        """
        Book an appointment with validation and conflict checking.
        
        Creates a new appointment after validating business exists, customers exist,
        appointment is in the future, and no time slot conflict exists.
        
        Args:
            business_id (int): ID of the business to book with
            customer_ids (List[int]): List of customer IDs for this appointment (min 1)
            appointment_date (date): Date of the appointment
            appointment_time (time): Time of the appointment
            notes (str): Optional notes about the appointment (default: "")
        
        Returns:
            Appointment: The newly created appointment instance
        
        Raises:
            BusinessNotFoundError: If business doesn't exist
            InvalidAppointmentDataError: If validation fails (no customers, past date, etc.)
            TimeSlotConflictError: If the time slot is already booked
        """
        # Validate input parameters
        if not customer_ids or len(customer_ids) == 0:
            raise InvalidAppointmentDataError("At least one customer is required for an appointment")
        
        if not appointment_date:
            raise InvalidAppointmentDataError("Appointment date is required")
        
        if not appointment_time:
            raise InvalidAppointmentDataError("Appointment time is required")
        
        # Validate appointment is in the future
        appointment_datetime = datetime.combine(appointment_date, appointment_time)
        if appointment_datetime <= datetime.now():
            raise InvalidAppointmentDataError(
                f"Appointment date and time must be in the future "
                f"(got {appointment_date} {appointment_time})"
            )
        
        # Get business (will raise BusinessNotFoundError if not found)
        business = BusinessRepository.get_business_by_id(business_id)
        
        # Get customers and validate they exist
        customers = []
        for customer_id in customer_ids:
            try:
                customer = Customer.objects.get(user_id=customer_id)
                customers.append(customer)
            except Customer.DoesNotExist:
                raise InvalidAppointmentDataError(f"Customer with ID {customer_id} not found")
        
        # Delegate to repository for creation (it will handle time slot conflict checking)
        return AppointmentRepository.create_appointment(
            business=business,
            customers=customers,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            notes=notes
        )
    
    @staticmethod
    def cancel_appointment_by_customer(
        appointment_id: int,
        customer: Customer
    ) -> Appointment:
        """
        Cancel appointment if customer is part of it.
        
        Cancels the appointment after verifying that the customer is associated
        with it. Only customers who are part of the appointment can cancel it.
        
        Args:
            appointment_id (int): ID of the appointment to cancel
            customer (Customer): Customer attempting to cancel the appointment
        
        Returns:
            Appointment: The cancelled appointment instance
        
        Raises:
            InvalidAppointmentDataError: If appointment not found or already cancelled
            UnauthorizedAccessError: If customer is not part of the appointment
        """
        # Validate customer exists
        if not customer:
            raise InvalidAppointmentDataError("Customer is required")
        
        # Get appointment (will raise InvalidAppointmentDataError if not found)
        appointment = AppointmentRepository.get_appointment_by_id(appointment_id)
        
        # Verify customer is part of this appointment
        if not appointment.customers.filter(user_id=customer.user_id).exists():
            raise UnauthorizedAccessError(
                f"Customer {customer.full_name} is not authorized to cancel "
                f"appointment {appointment_id}"
            )
        
        # Delegate to repository for cancellation
        return AppointmentRepository.cancel_appointment(appointment_id)
    
    @staticmethod
    def cancel_appointment_by_provider(
        appointment_id: int,
        provider: Provider
    ) -> Appointment:
        """
        Cancel appointment if provider owns the business.
        
        Cancels the appointment after verifying that the provider owns the
        business associated with the appointment.
        
        Args:
            appointment_id (int): ID of the appointment to cancel
            provider (Provider): Provider attempting to cancel the appointment
        
        Returns:
            Appointment: The cancelled appointment instance
        
        Raises:
            InvalidAppointmentDataError: If appointment not found or already cancelled
            UnauthorizedAccessError: If provider doesn't own the business
        """
        # Validate provider exists
        if not provider:
            raise InvalidAppointmentDataError("Provider is required")
        
        # Get appointment (will raise InvalidAppointmentDataError if not found)
        appointment = AppointmentRepository.get_appointment_by_id(appointment_id)
        
        # Verify provider owns the business
        if not BusinessRepository.verify_ownership(appointment.business, provider):
            raise UnauthorizedAccessError(
                f"Provider {provider.user.username} is not authorized to cancel "
                f"appointment {appointment_id} (business owned by different provider)"
            )
        
        # Delegate to repository for cancellation
        return AppointmentRepository.cancel_appointment(appointment_id)
    
    @staticmethod
    def get_customer_appointments(customer: Customer) -> Dict[str, List[Appointment]]:
        """
        Get customer appointments grouped by upcoming/past.
        
        Retrieves all appointments for the customer and groups them into
        upcoming (future and active) and past (past or cancelled) appointments.
        
        Args:
            customer (Customer): Customer whose appointments to retrieve
        
        Returns:
            Dict[str, List[Appointment]]: Dictionary with 'upcoming' and 'past' keys
                                        containing lists of appointments
        
        Raises:
            InvalidAppointmentDataError: If customer is not provided
        """
        # Validate customer exists
        if not customer:
            raise InvalidAppointmentDataError("Customer is required")
        
        # Get all appointments for customer
        appointments = AppointmentRepository.get_appointments_by_customer(customer)
        
        # Group appointments by upcoming/past
        upcoming = []
        past = []
        
        now = datetime.now()
        
        for appointment in appointments:
            appointment_datetime = datetime.combine(
                appointment.appointment_date,
                appointment.appointment_time
            )
            
            # Upcoming: future appointments that are still active
            if appointment_datetime > now and appointment.status == 'ACTIVE':
                upcoming.append(appointment)
            else:
                # Past: past appointments or cancelled appointments
                past.append(appointment)
        
        return {
            'upcoming': upcoming,
            'past': past
        }
    
    @staticmethod
    def get_provider_appointments(
        provider: Provider,
        business_id: Optional[int] = None
    ) -> List[Appointment]:
        """
        Get provider appointments, optionally filtered by business.
        
        Retrieves all appointments for businesses owned by the provider.
        If business_id is provided, filters to only that business after
        verifying ownership.
        
        Args:
            provider (Provider): Provider whose appointments to retrieve
            business_id (int, optional): Specific business ID to filter by
        
        Returns:
            List[Appointment]: List of appointments for provider's businesses
        
        Raises:
            InvalidAppointmentDataError: If provider is not provided
            BusinessNotFoundError: If business_id provided but business not found
            UnauthorizedAccessError: If provider doesn't own the specified business
        """
        # Validate provider exists
        if not provider:
            raise InvalidAppointmentDataError("Provider is required")
        
        # If business_id is specified, filter by that business
        if business_id is not None:
            # Get business and verify ownership
            business = BusinessRepository.get_business_by_id(business_id)
            
            if not BusinessRepository.verify_ownership(business, provider):
                raise UnauthorizedAccessError(
                    f"Provider {provider.user.username} is not authorized to view "
                    f"appointments for business {business_id}"
                )
            
            # Get appointments for specific business
            return AppointmentRepository.get_appointments_by_business(business)
        
        # Get all appointments for provider's businesses
        return AppointmentRepository.get_appointments_by_provider(provider)
    
    @staticmethod
    def get_appointment_by_id_for_customer(
        appointment_id: int,
        customer: Customer
    ) -> Appointment:
        """
        Get a specific appointment for a customer with authorization.
        
        Retrieves the appointment after verifying that the customer is
        associated with it.
        
        Args:
            appointment_id (int): ID of the appointment to retrieve
            customer (Customer): Customer attempting to access the appointment
        
        Returns:
            Appointment: The appointment instance
        
        Raises:
            InvalidAppointmentDataError: If appointment not found
            UnauthorizedAccessError: If customer is not part of the appointment
        """
        # Validate customer exists
        if not customer:
            raise InvalidAppointmentDataError("Customer is required")
        
        # Get appointment (will raise InvalidAppointmentDataError if not found)
        appointment = AppointmentRepository.get_appointment_by_id(appointment_id)
        
        # Verify customer is part of this appointment
        if not appointment.customers.filter(user_id=customer.user_id).exists():
            raise UnauthorizedAccessError(
                f"Customer {customer.full_name} is not authorized to access "
                f"appointment {appointment_id}"
            )
        
        return appointment
    
    @staticmethod
    def get_appointment_by_id_for_provider(
        appointment_id: int,
        provider: Provider
    ) -> Appointment:
        """
        Get a specific appointment for a provider with authorization.
        
        Retrieves the appointment after verifying that the provider owns
        the business associated with it.
        
        Args:
            appointment_id (int): ID of the appointment to retrieve
            provider (Provider): Provider attempting to access the appointment
        
        Returns:
            Appointment: The appointment instance
        
        Raises:
            InvalidAppointmentDataError: If appointment not found
            UnauthorizedAccessError: If provider doesn't own the business
        """
        # Validate provider exists
        if not provider:
            raise InvalidAppointmentDataError("Provider is required")
        
        # Get appointment (will raise InvalidAppointmentDataError if not found)
        appointment = AppointmentRepository.get_appointment_by_id(appointment_id)
        
        # Verify provider owns the business
        if not BusinessRepository.verify_ownership(appointment.business, provider):
            raise UnauthorizedAccessError(
                f"Provider {provider.user.username} is not authorized to access "
                f"appointment {appointment_id} (business owned by different provider)"
            )
        
        return appointment
    
    @staticmethod
    def check_time_slot_availability(
        business_id: int,
        appointment_date: date,
        appointment_time: time
    ) -> bool:
        """
        Check if a time slot is available for booking.
        
        Verifies that no ACTIVE appointment exists for the given business
        at the specified date and time. This is a public operation.
        
        Args:
            business_id (int): ID of the business to check availability for
            appointment_date (date): Date to check
            appointment_time (time): Time to check
        
        Returns:
            bool: True if time slot is available, False if already booked
        
        Raises:
            BusinessNotFoundError: If business doesn't exist
        """
        # Get business (will raise BusinessNotFoundError if not found)
        business = BusinessRepository.get_business_by_id(business_id)
        
        # Delegate to repository for availability check
        return AppointmentRepository.check_time_slot_available(
            business, appointment_date, appointment_time
        )