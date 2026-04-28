"""
Appointment service for AliceTant application.

This module provides the service layer for appointment operations, implementing
business logic, authorization checks, and validation. It acts as an intermediary
between the API layer and the repository layer.
"""

from typing import List, Dict, Optional
from datetime import date, time, datetime

from ..models import Appointment, AppointmentStatus, Business, Customer, Provider, Availability
from ..repositories.appointment_repository import AppointmentRepository
from ..repositories.business_repository import BusinessRepository
from ..repositories.system_setting_repository import SystemSettingRepository
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
    def _validate_duration_limit(start_time: time, end_time: time = None):
        if not end_time:
            return

        duration_minutes = int(
            (
                datetime.combine(date.min, end_time) -
                datetime.combine(date.min, start_time)
            ).total_seconds() // 60
        )
        max_duration_minutes = SystemSettingRepository.get(
            'max_appointment_duration_minutes',
            480,
        )

        if duration_minutes > max_duration_minutes:
            raise InvalidAppointmentDataError(
                f"Appointment duration cannot exceed {max_duration_minutes} minutes"
            )
    
    @staticmethod
    def book_appointment(
        business_id: int,
        customer_ids: List[int],
        appointment_date: date,
        appointment_time: time,
        end_time: time = None,
        availability_id: int = None,
        notes: str = ""
    ) -> Appointment:
        """
        Book an appointment with validation and capacity checking.

        If availability_id is provided, validates that:
          - The availability slot exists and belongs to the business
          - The requested time window falls within the availability window
          - The availability's capacity allows another booking

        Args:
            business_id: ID of the business to book with
            customer_ids: List of customer IDs (min 1)
            appointment_date: Date of the appointment
            appointment_time: Start time of the appointment
            end_time: End time of the appointment (optional, defaults to availability end)
            availability_id: ID of the availability slot to book against (optional)
            notes: Optional notes

        Returns:
            Appointment: The newly created appointment instance

        Raises:
            BusinessNotFoundError: If business doesn't exist
            InvalidAppointmentDataError: If validation fails
            TimeSlotConflictError: If capacity exceeded
        """
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

        # Get business
        business = BusinessRepository.get_business_by_id(business_id)

        # Resolve availability slot
        availability = None
        if availability_id:
            try:
                availability = Availability.objects.get(id=availability_id)
            except Availability.DoesNotExist:
                raise InvalidAppointmentDataError(f"Availability slot {availability_id} not found")

            if availability.business_id != business.id:
                raise InvalidAppointmentDataError("Availability slot does not belong to this business")

            # Validate the appointment date matches the availability date
            if availability.date != appointment_date:
                raise InvalidAppointmentDataError(
                    f"Appointment date {appointment_date} does not match "
                    f"availability date {availability.date}"
                )

            # Validate the requested time falls within the availability window
            if appointment_time < availability.start_time:
                raise InvalidAppointmentDataError(
                    f"Appointment start time {appointment_time} is before "
                    f"availability start {availability.start_time}"
                )

            effective_end = end_time or appointment_time
            if effective_end > availability.end_time:
                raise InvalidAppointmentDataError(
                    f"Appointment end time {effective_end} is after "
                    f"availability end {availability.end_time}"
                )

            # Default end_time to availability end if not provided
            if not end_time:
                end_time = availability.end_time

        # Validate end_time > start_time when provided
        if end_time and end_time <= appointment_time:
            raise InvalidAppointmentDataError("Appointment end time must be after start time")

        AppointmentService._validate_duration_limit(appointment_time, end_time)

        # Get customers and validate they exist
        customers = []
        max_bookings_per_customer_per_day = SystemSettingRepository.get(
            'max_bookings_per_customer_per_day',
            10,
        )
        for customer_id in customer_ids:
            try:
                customer = Customer.objects.get(user_id=customer_id)
                customers.append(customer)
            except Customer.DoesNotExist:
                raise InvalidAppointmentDataError(f"Customer with ID {customer_id} not found")

            daily_booking_count = AppointmentRepository.count_customer_active_for_date(
                customer_id=customer_id,
                appointment_date=appointment_date,
            )
            if daily_booking_count >= max_bookings_per_customer_per_day:
                raise InvalidAppointmentDataError(
                    f"Customer {customer_id} already reached the daily booking limit "
                    f"of {max_bookings_per_customer_per_day} active appointments"
                )

        return AppointmentRepository.create_appointment(
            business=business,
            customers=customers,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            end_time=end_time,
            availability=availability,
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

    # ── Modification workflow ───────────────────────────────────────

    @staticmethod
    def propose_modification_by_customer(
        appointment_id: int,
        customer: Customer,
        new_date: date,
        new_time: time,
        new_end_time: time = None,
        new_notes: str = "",
    ):
        """Customer proposes a modification; provider must approve."""
        appointment = AppointmentRepository.get_appointment_by_id(appointment_id)

        if appointment.status not in (AppointmentStatus.ACTIVE, AppointmentStatus.PENDING_MODIFICATION):
            raise InvalidAppointmentDataError("Only active appointments can be modified")

        if not appointment.customers.filter(user_id=customer.user_id).exists():
            raise UnauthorizedAccessError("You are not part of this appointment")

        if new_end_time and new_end_time <= new_time:
            raise InvalidAppointmentDataError("Appointment end time must be after start time")

        AppointmentService._validate_duration_limit(new_time, new_end_time)

        return AppointmentRepository.create_pending_modification(
            appointment=appointment,
            proposed_by='CUSTOMER',
            proposed_by_user_id=customer.user_id,
            new_date=new_date,
            new_time=new_time,
            new_end_time=new_end_time,
            new_notes=new_notes,
        )

    @staticmethod
    def propose_modification_by_provider(
        appointment_id: int,
        provider: Provider,
        new_date: date,
        new_time: time,
        new_end_time: time = None,
        new_notes: str = "",
    ):
        """Provider proposes a modification; customer must approve."""
        appointment = AppointmentRepository.get_appointment_by_id(appointment_id)

        if appointment.status not in (AppointmentStatus.ACTIVE, AppointmentStatus.PENDING_MODIFICATION):
            raise InvalidAppointmentDataError("Only active appointments can be modified")

        if not BusinessRepository.verify_ownership(appointment.business, provider):
            raise UnauthorizedAccessError("You don't own this appointment's business")

        if new_end_time and new_end_time <= new_time:
            raise InvalidAppointmentDataError("Appointment end time must be after start time")

        AppointmentService._validate_duration_limit(new_time, new_end_time)

        return AppointmentRepository.create_pending_modification(
            appointment=appointment,
            proposed_by='PROVIDER',
            proposed_by_user_id=provider.user_id,
            new_date=new_date,
            new_time=new_time,
            new_end_time=new_end_time,
            new_notes=new_notes,
        )

    @staticmethod
    def respond_to_modification(modification_id: int, user, approve: bool):
        """
        Approve or reject a pending modification.

        The person who proposed the change cannot approve it themselves;
        the *other* party must approve.
        """
        from ..models import PendingModification as PM
        try:
            mod = PM.objects.select_related('appointment', 'appointment__business__provider').get(
                id=modification_id,
                status=PM.ModificationStatus.PENDING,
            )
        except PM.DoesNotExist:
            raise InvalidAppointmentDataError("Pending modification not found or already resolved")

        appt = mod.appointment

        # Determine if caller is the "other" party
        if mod.proposed_by == 'CUSTOMER':
            # Only the provider of this business may approve
            if not user.is_provider():
                raise UnauthorizedAccessError("Only the provider can respond to customer modifications")
            try:
                provider = Provider.objects.get(user=user)
            except Provider.DoesNotExist:
                raise UnauthorizedAccessError("Provider profile not found")
            if appt.business.provider_id != provider.pk:
                raise UnauthorizedAccessError("You don't own this appointment's business")
        else:
            # mod proposed by provider → only a customer on this appointment may approve
            if not user.is_customer():
                raise UnauthorizedAccessError("Only the customer can respond to provider modifications")
            try:
                customer = Customer.objects.get(user=user)
            except Customer.DoesNotExist:
                raise UnauthorizedAccessError("Customer profile not found")
            if not appt.customers.filter(pk=customer.pk).exists():
                raise UnauthorizedAccessError("You are not part of this appointment")

        if approve:
            return AppointmentRepository.approve_modification(modification_id)
        else:
            return AppointmentRepository.reject_modification(modification_id)