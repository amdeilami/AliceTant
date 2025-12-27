"""
Application-specific exceptions for the AliceTant application.
"""

from .user_exceptions import (
    UserNotFoundError,
    DuplicateUserError,
    InvalidUserDataError,
    BusinessNotFoundError,
    UnauthorizedAccessError,
    InvalidAppointmentDataError,
    TimeSlotConflictError,
)

__all__ = [
    'UserNotFoundError',
    'DuplicateUserError',
    'InvalidUserDataError',
    'BusinessNotFoundError',
    'UnauthorizedAccessError',
    'InvalidAppointmentDataError',
    'TimeSlotConflictError',
]
