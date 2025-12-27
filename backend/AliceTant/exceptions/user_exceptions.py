"""
Exception classes for the AliceTant application.

This module defines custom exceptions for user, business, and appointment operations
including not found scenarios, authorization errors, validation failures, and
scheduling conflicts.
"""


class UserNotFoundError(Exception):
    """
    Exception raised when a user cannot be found in the database.
    
    This exception should be raised when attempting to retrieve a user
    by ID, username, or email, and no matching user exists in the database.
    
    Args:
        message (str): Descriptive error message indicating which user
                      was not found and how it was queried.
    
    Example:
        raise UserNotFoundError(f"User with username '{username}' not found")
    """
    pass


class DuplicateUserError(Exception):
    """
    Exception raised when attempting to create a user with an existing username or email.
    
    This exception should be raised when a unique constraint violation occurs,
    specifically when trying to create a new user with a username or email
    that already exists in the database.
    
    Args:
        message (str): Descriptive error message indicating which field
                      (username or email) caused the duplicate constraint violation.
    
    Example:
        raise DuplicateUserError(f"User with email '{email}' already exists")
    """
    pass


class InvalidUserDataError(Exception):
    """
    Exception raised when user data fails validation.
    
    This exception should be raised when user input does not meet validation
    requirements, such as invalid email format, invalid password format,
    missing required fields, or data that violates business rules.
    
    Args:
        message (str): Descriptive error message indicating which validation
                      rule was violated and what data was invalid.
    
    Example:
        raise InvalidUserDataError("Email format is invalid")
        raise InvalidUserDataError("Password must be at least 8 characters")
    """
    pass


class BusinessNotFoundError(Exception):
    """
    Exception raised when a business cannot be found in the database.
    
    This exception should be raised when attempting to retrieve a business
    by ID and no matching business exists in the database.
    
    Args:
        message (str): Descriptive error message indicating which business
                      was not found and how it was queried.
    
    Example:
        raise BusinessNotFoundError(f"Business with ID {business_id} not found")
    """
    pass


class UnauthorizedAccessError(Exception):
    """
    Exception raised when a provider attempts to access or modify a business they do not own.
    
    This exception should be raised when ownership verification fails, specifically
    when a provider tries to update, delete, or perform operations on a business
    that belongs to a different provider.
    
    Args:
        message (str): Descriptive error message indicating the unauthorized
                      operation that was attempted.
    
    Example:
        raise UnauthorizedAccessError(
            f"Provider {provider_id} is not authorized to modify business {business_id}"
        )
    """
    pass


class InvalidAppointmentDataError(Exception):
    """
    Exception raised when appointment data fails validation.
    
    This exception should be raised when appointment input does not meet validation
    requirements, such as invalid date format, missing required fields, past dates,
    or data that violates business rules for appointments.
    
    Args:
        message (str): Descriptive error message indicating which validation
                      rule was violated and what data was invalid.
    
    Example:
        raise InvalidAppointmentDataError("Appointment date must be in the future")
        raise InvalidAppointmentDataError("At least one customer is required")
    """
    pass


class TimeSlotConflictError(Exception):
    """
    Exception raised when attempting to book an appointment in an already-occupied time slot.
    
    This exception should be raised when a time slot conflict is detected, specifically
    when trying to create an appointment for a business at a date and time that already
    has an active appointment.
    
    Args:
        message (str): Descriptive error message indicating the conflicting time slot
                      and business.
    
    Example:
        raise TimeSlotConflictError(
            f"Time slot {date} at {time} is already booked for business {business_id}"
        )
    """
    pass
