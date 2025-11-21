"""
User repository for AliceTant application.

This module provides a repository layer that abstracts database operations
for user management, including CRUD operations and queries. It translates
Django ORM exceptions into domain-specific exceptions.
"""

from typing import List, Optional
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email as django_validate_email

from ..models import User, Provider, Customer
from ..models.user import UserRole
from ..exceptions.user_exceptions import (
    UserNotFoundError,
    DuplicateUserError,
    InvalidUserDataError
)


class UserRepository:
    """
    Repository for user data access operations.
    
    Abstracts database operations from business logic, providing a clean
    interface for user management. All methods are static as the repository
    maintains no state.
    """
    
    @staticmethod
    def create_user(username: str, email: str, password: str, 
                   role: str, **extra_fields) -> User:
        """
        Create a new user with hashed password.
        
        Validates user data, hashes the password using Django's authentication
        system, and creates a new user record in the database.
        
        Args:
            username (str): Unique username for the user
            email (str): Unique email address for the user
            password (str): Plain text password (will be hashed)
            role (str): User role (must be 'PROVIDER' or 'CUSTOMER')
            **extra_fields: Additional fields like first_name, last_name
        
        Returns:
            User: The newly created user instance
        
        Raises:
            DuplicateUserError: If username or email already exists
            InvalidUserDataError: If validation fails for any field
        """
        try:
            # Validate email format
            django_validate_email(email)
        except ValidationError:
            raise InvalidUserDataError(f"Invalid email format: {email}")
        
        # Validate role
        if role not in [UserRole.PROVIDER, UserRole.CUSTOMER]:
            raise InvalidUserDataError(
                f"Invalid role: {role}. Must be PROVIDER or CUSTOMER"
            )
        
        # Validate password
        try:
            validate_password(password)
        except ValidationError as e:
            raise InvalidUserDataError(f"Password validation failed: {', '.join(e.messages)}")
        
        # Check for existing username or email
        if User.objects.filter(username=username).exists():
            raise DuplicateUserError(f"User with username '{username}' already exists")
        
        if User.objects.filter(email=email).exists():
            raise DuplicateUserError(f"User with email '{email}' already exists")
        
        try:
            # Create user with hashed password
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role,
                **extra_fields
            )
            return user
        except IntegrityError as e:
            # Handle race condition where duplicate was created between check and insert
            if 'username' in str(e):
                raise DuplicateUserError(f"User with username '{username}' already exists")
            elif 'email' in str(e):
                raise DuplicateUserError(f"User with email '{email}' already exists")
            else:
                raise InvalidUserDataError(f"Database integrity error: {str(e)}")
        except Exception as e:
            raise InvalidUserDataError(f"Failed to create user: {str(e)}")
    
    @staticmethod
    def create_provider(user: User, business_name: str, 
                       bio: str = "", **extra_fields) -> Provider:
        """
        Create provider profile for a user.
        
        Creates a provider profile linked to an existing user. The user
        must have the PROVIDER role.
        
        Args:
            user (User): User instance to create provider profile for
            business_name (str): Name of the provider's business
            bio (str): Business description (max 4096 characters)
            **extra_fields: Additional fields like phone_number, address
        
        Returns:
            Provider: The newly created provider profile
        
        Raises:
            InvalidUserDataError: If user role is not PROVIDER or validation fails
        """
        # Validate user role
        if user.role != UserRole.PROVIDER:
            raise InvalidUserDataError(
                f"Cannot create provider profile for user with role {user.role}. "
                "User must have PROVIDER role."
            )
        
        # Validate bio length
        if len(bio) > 4096:
            raise InvalidUserDataError(
                f"Bio exceeds maximum length of 4096 characters (got {len(bio)})"
            )
        
        try:
            provider = Provider.objects.create(
                user=user,
                business_name=business_name,
                bio=bio,
                **extra_fields
            )
            return provider
        except IntegrityError as e:
            raise InvalidUserDataError(
                f"Provider profile already exists for user {user.username}"
            )
        except Exception as e:
            raise InvalidUserDataError(f"Failed to create provider profile: {str(e)}")
    
    @staticmethod
    def create_customer(user: User, full_name: str, **extra_fields) -> Customer:
        """
        Create customer profile for a user.
        
        Creates a customer profile linked to an existing user. The user
        must have the CUSTOMER role.
        
        Args:
            user (User): User instance to create customer profile for
            full_name (str): Customer's full name
            **extra_fields: Additional fields like phone_number, preferences
        
        Returns:
            Customer: The newly created customer profile
        
        Raises:
            InvalidUserDataError: If user role is not CUSTOMER or validation fails
        """
        # Validate user role
        if user.role != UserRole.CUSTOMER:
            raise InvalidUserDataError(
                f"Cannot create customer profile for user with role {user.role}. "
                "User must have CUSTOMER role."
            )
        
        try:
            customer = Customer.objects.create(
                user=user,
                full_name=full_name,
                **extra_fields
            )
            return customer
        except IntegrityError as e:
            raise InvalidUserDataError(
                f"Customer profile already exists for user {user.username}"
            )
        except Exception as e:
            raise InvalidUserDataError(f"Failed to create customer profile: {str(e)}")
    
    @staticmethod
    def get_user_by_id(user_id: int) -> User:
        """
        Retrieve user by ID.
        
        Args:
            user_id (int): The ID of the user to retrieve
        
        Returns:
            User: The user instance with the specified ID
        
        Raises:
            UserNotFoundError: If no user exists with the given ID
        """
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise UserNotFoundError(f"User with ID {user_id} not found")
    
    @staticmethod
    def get_user_by_username(username: str) -> User:
        """
        Retrieve user by username.
        
        Args:
            username (str): The username of the user to retrieve
        
        Returns:
            User: The user instance with the specified username
        
        Raises:
            UserNotFoundError: If no user exists with the given username
        """
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            raise UserNotFoundError(f"User with username '{username}' not found")
    
    @staticmethod
    def get_user_by_email(email: str) -> User:
        """
        Retrieve user by email.
        
        Args:
            email (str): The email address of the user to retrieve
        
        Returns:
            User: The user instance with the specified email
        
        Raises:
            UserNotFoundError: If no user exists with the given email
        """
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            raise UserNotFoundError(f"User with email '{email}' not found")
    
    @staticmethod
    def get_users_by_role(role: str) -> List[User]:
        """
        Retrieve all users with specified role.
        
        Args:
            role (str): The role to filter by (PROVIDER or CUSTOMER)
        
        Returns:
            List[User]: List of users with the specified role
        
        Raises:
            InvalidUserDataError: If role is not valid
        """
        if role not in [UserRole.PROVIDER, UserRole.CUSTOMER]:
            raise InvalidUserDataError(
                f"Invalid role: {role}. Must be PROVIDER or CUSTOMER"
            )
        
        return list(User.objects.filter(role=role))
    
    @staticmethod
    def get_all_users(limit: int = 100, offset: int = 0) -> List[User]:
        """
        Retrieve all users with pagination.
        
        Args:
            limit (int): Maximum number of users to return (default: 100)
            offset (int): Number of users to skip (default: 0)
        
        Returns:
            List[User]: List of users within the specified pagination range
        """
        return list(User.objects.all()[offset:offset + limit])
    
    @staticmethod
    def update_user(user: User, **fields) -> User:
        """
        Update user fields.
        
        Updates the specified fields on the user instance and saves to database.
        Validates constraints before persisting changes.
        
        Args:
            user (User): The user instance to update
            **fields: Fields to update (e.g., email='new@email.com', first_name='John')
        
        Returns:
            User: The updated user instance
        
        Raises:
            DuplicateUserError: If updating email/username to an existing value
            InvalidUserDataError: If validation fails
        """
        # Handle password update separately with hashing
        if 'password' in fields:
            password = fields.pop('password')
            try:
                validate_password(password)
                user.set_password(password)
            except ValidationError as e:
                raise InvalidUserDataError(
                    f"Password validation failed: {', '.join(e.messages)}"
                )
        
        # Validate email if being updated
        if 'email' in fields:
            email = fields['email']
            try:
                django_validate_email(email)
            except ValidationError:
                raise InvalidUserDataError(f"Invalid email format: {email}")
            
            # Check for duplicate email (excluding current user)
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                raise DuplicateUserError(f"User with email '{email}' already exists")
        
        # Validate username if being updated
        if 'username' in fields:
            username = fields['username']
            # Check for duplicate username (excluding current user)
            if User.objects.filter(username=username).exclude(id=user.id).exists():
                raise DuplicateUserError(f"User with username '{username}' already exists")
        
        # Validate role if being updated
        if 'role' in fields:
            role = fields['role']
            if role not in [UserRole.PROVIDER, UserRole.CUSTOMER]:
                raise InvalidUserDataError(
                    f"Invalid role: {role}. Must be PROVIDER or CUSTOMER"
                )
        
        try:
            # Update fields
            for field, value in fields.items():
                setattr(user, field, value)
            
            user.save()
            return user
        except IntegrityError as e:
            if 'username' in str(e):
                raise DuplicateUserError(
                    f"User with username '{fields.get('username')}' already exists"
                )
            elif 'email' in str(e):
                raise DuplicateUserError(
                    f"User with email '{fields.get('email')}' already exists"
                )
            else:
                raise InvalidUserDataError(f"Database integrity error: {str(e)}")
        except Exception as e:
            raise InvalidUserDataError(f"Failed to update user: {str(e)}")
    
    @staticmethod
    def delete_user(user_id: int) -> bool:
        """
        Delete user and associated profiles.
        
        Deletes the user with the specified ID. Associated provider or customer
        profiles are automatically deleted due to CASCADE delete constraint.
        
        Args:
            user_id (int): The ID of the user to delete
        
        Returns:
            bool: True if user was deleted, False otherwise
        
        Raises:
            UserNotFoundError: If no user exists with the given ID
        """
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return True
        except User.DoesNotExist:
            raise UserNotFoundError(f"User with ID {user_id} not found")
    
    @staticmethod
    def user_exists(username: str = None, email: str = None) -> bool:
        """
        Check if user exists by username or email.
        
        Args:
            username (str): Username to check (optional)
            email (str): Email to check (optional)
        
        Returns:
            bool: True if a user exists with the given username or email
        
        Raises:
            InvalidUserDataError: If neither username nor email is provided
        """
        if username is None and email is None:
            raise InvalidUserDataError(
                "Must provide either username or email to check existence"
            )
        
        if username and email:
            return User.objects.filter(username=username).exists() or \
                   User.objects.filter(email=email).exists()
        elif username:
            return User.objects.filter(username=username).exists()
        else:
            return User.objects.filter(email=email).exists()
