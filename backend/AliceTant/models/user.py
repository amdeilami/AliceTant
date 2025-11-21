"""
User model for the AliceTant application.

This module defines the custom User model that extends Django's AbstractUser
to include role-based differentiation between Providers and Customers.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    """
    Enumeration of user roles in the AliceTant system.
    
    Attributes:
        PROVIDER: Business owner who manages availability and appointments
        CUSTOMER: Client who books appointments with providers
    """
    PROVIDER = 'PROVIDER', 'Provider'
    CUSTOMER = 'CUSTOMER', 'Customer'


class User(AbstractUser):
    """
    Custom user model for AliceTant with role-based access.
    
    Extends Django's AbstractUser to add role differentiation and ensure
    email uniqueness. Inherits username, password, first_name, last_name,
    and other standard user fields from AbstractUser.
    
    Attributes:
        role (str): User's role in the system (PROVIDER or CUSTOMER)
        email (str): User's email address (must be unique)
        created_at (datetime): Timestamp when the user was created
        updated_at (datetime): Timestamp when the user was last modified
    
    Inherited from AbstractUser:
        username (str): Unique username for authentication
        password (str): Hashed password
        first_name (str): User's first name
        last_name (str): User's last name
        is_active (bool): Whether the user account is active
        is_staff (bool): Whether the user can access admin site
        is_superuser (bool): Whether the user has all permissions
        date_joined (datetime): When the user account was created
    """
    
    role = models.CharField(
        max_length=10,
        choices=UserRole.choices,
        null=False,
        blank=False,
        help_text="User's role in the system (PROVIDER or CUSTOMER)"
    )
    
    email = models.EmailField(
        unique=True,
        null=False,
        blank=False,
        help_text="User's email address (must be unique)"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the user was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the user was last modified"
    )
    
    class Meta:
        """
        Meta options for the User model.
        """
        db_table = 'alicetant_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['role'], name='user_role_idx'),
        ]
    
    def __str__(self):
        """
        String representation of the User.
        
        Returns:
            str: Username and role of the user
        """
        return f"{self.username} ({self.get_role_display()})"
    
    def is_provider(self):
        """
        Check if the user is a provider.
        
        Returns:
            bool: True if user role is PROVIDER, False otherwise
        """
        return self.role == UserRole.PROVIDER
    
    def is_customer(self):
        """
        Check if the user is a customer.
        
        Returns:
            bool: True if user role is CUSTOMER, False otherwise
        """
        return self.role == UserRole.CUSTOMER
