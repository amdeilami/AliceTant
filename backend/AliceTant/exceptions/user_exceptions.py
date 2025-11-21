"""
User-related exception classes for the AliceTant application.

This module defines custom exceptions for user operations including
user not found scenarios, duplicate user attempts, and invalid user data.
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
