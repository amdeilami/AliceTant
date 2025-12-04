"""
Authentication service for AliceTant application.

This module provides business logic for user authentication and registration,
including username generation, JWT token creation, user registration with
profile creation, and credential verification.
"""

import jwt
from datetime import datetime, timedelta
from typing import Optional, Tuple
from django.db import transaction
from django.conf import settings
from django.contrib.auth.hashers import check_password

from ..models import User
from ..models.user import UserRole
from ..repositories.user_repository import UserRepository
from ..exceptions.user_exceptions import (
    UserNotFoundError,
    DuplicateUserError,
    InvalidUserDataError
)


class AuthService:
    """
    Service layer for authentication operations.
    
    Provides high-level business logic for user registration, authentication,
    username generation, and JWT token management. Coordinates between the
    repository layer and API views.
    """
    
    @staticmethod
    def generate_username(email: str) -> str:
        """
        Generate a unique username from an email address.
        
        Extracts the local part (before @) from the email and ensures uniqueness
        by appending incrementing numbers if the username already exists.
        
        Args:
            email (str): Email address to derive username from
        
        Returns:
            str: Unique username derived from email
        
        Raises:
            InvalidUserDataError: If email format is invalid
        
        Example:
            >>> generate_username("john.doe@example.com")
            "john.doe"
            >>> generate_username("john.doe@example.com")  # if john.doe exists
            "john.doe1"
        """
        if not email or '@' not in email:
            raise InvalidUserDataError(f"Invalid email format: {email}")
        
        # Extract local part from email (before @)
        base_username = email.split('@')[0]
        
        # Ensure username is not empty
        if not base_username:
            raise InvalidUserDataError(f"Cannot derive username from email: {email}")
        
        # Check if base username is available
        username = base_username
        counter = 1
        
        # Keep incrementing counter until we find an available username
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        return username
    
    @staticmethod
    def generate_jwt_token(user: User) -> str:
        """
        Generate a JWT authentication token for a user.
        
        Creates a JWT token containing user identification and role information,
        with a 7-day expiration period. The token is signed using Django's
        SECRET_KEY.
        
        Args:
            user (User): User instance to generate token for
        
        Returns:
            str: JWT token string
        
        Example:
            >>> token = generate_jwt_token(user)
            >>> # Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        """
        # Create payload with user information
        payload = {
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
            'iat': datetime.utcnow()  # Issued at timestamp
        }
        
        # Encode and sign the token
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        return token
    
    @staticmethod
    @transaction.atomic
    def register_user(
        full_name: str,
        email: str,
        password: str,
        role: str,
        phone_number: Optional[str] = None
    ) -> User:
        """
        Register a new user with role-specific profile.
        
        Creates a new user account and associated profile (Customer or Provider)
        in a single atomic transaction. If profile creation fails, the entire
        operation is rolled back.
        
        Args:
            full_name (str): User's full name (also used as business_name for providers)
            email (str): User's email address (must be unique)
            password (str): Plain text password (will be hashed)
            role (str): User role ('customer' or 'provider', case-insensitive)
            phone_number (str, optional): Contact phone number
        
        Returns:
            User: The newly created user instance with associated profile
        
        Raises:
            DuplicateUserError: If email or username already exists
            InvalidUserDataError: If validation fails or profile creation fails
        
        Example:
            >>> user = register_user(
            ...     full_name="John Doe",
            ...     email="john@example.com",
            ...     password="SecurePass123",
            ...     role="customer",
            ...     phone_number="555-1234"
            ... )
        """
        # Normalize role to uppercase
        role_upper = role.upper()
        
        # Validate role
        if role_upper not in [UserRole.PROVIDER, UserRole.CUSTOMER]:
            raise InvalidUserDataError(
                f"Invalid role: {role}. Must be 'customer' or 'provider'"
            )
        
        # Generate unique username from email
        username = AuthService.generate_username(email)
        
        # Create user via repository
        user = UserRepository.create_user(
            username=username,
            email=email,
            password=password,
            role=role_upper
        )
        
        try:
            # Create role-specific profile
            if role_upper == UserRole.CUSTOMER:
                # Create customer profile
                UserRepository.create_customer(
                    user=user,
                    full_name=full_name,
                    phone_number=phone_number or ''
                )
            else:  # PROVIDER
                # Create provider profile (use full_name as business_name)
                UserRepository.create_provider(
                    user=user,
                    business_name=full_name,
                    bio='',
                    phone_number=phone_number or ''
                )
            
            return user
            
        except Exception as e:
            # If profile creation fails, transaction will be rolled back
            # Re-raise as InvalidUserDataError with context
            raise InvalidUserDataError(
                f"Failed to create {role_upper.lower()} profile: {str(e)}"
            )
    
    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[User]:
        """
        Authenticate a user with email and password.
        
        Verifies user credentials by checking if a user with the given email
        exists and if the provided password matches the stored hash.
        
        Args:
            email (str): User's email address
            password (str): Plain text password to verify
        
        Returns:
            User: The authenticated user instance if credentials are valid
            None: If credentials are invalid or user doesn't exist
        
        Example:
            >>> user = authenticate_user("john@example.com", "SecurePass123")
            >>> if user:
            ...     print(f"Authenticated as {user.username}")
            ... else:
            ...     print("Invalid credentials")
        """
        try:
            # Retrieve user by email
            user = UserRepository.get_user_by_email(email)
            
            # Verify password using Django's check_password
            if check_password(password, user.password):
                return user
            else:
                return None
                
        except UserNotFoundError:
            # User doesn't exist - return None (don't reveal this to caller)
            return None
