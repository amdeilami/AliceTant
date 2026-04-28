"""
User model for the AliceTant application.

This module defines the custom User model that extends Django's AbstractUser
to include role-based differentiation between Providers and Customers.
"""

import random

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
    ADMIN = 'ADMIN', 'Admin'


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
        help_text="User's role in the system (PROVIDER, CUSTOMER, or ADMIN)"
    )
    
    email = models.EmailField(
        unique=True,
        null=False,
        blank=False,
        help_text="User's email address (must be unique)"
    )

    is_suspended = models.BooleanField(
        default=False,
        help_text="Whether the user account is suspended"
    )

    suspended_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the user account was suspended"
    )

    suspension_reason = models.TextField(
        blank=True,
        help_text="Reason for suspending the user account"
    )

    must_change_password = models.BooleanField(
        default=False,
        help_text="Whether the user must change their password on next login"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the user was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the user was last modified"
    )

    reference_id = models.PositiveIntegerField(
        unique=True,
        editable=False,
        null=True,
        help_text="Unique 8-digit reference ID for display"
    )

    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        help_text="User's profile picture"
    )

    def save(self, *args, **kwargs):
        if not self.reference_id:
            self.reference_id = self._generate_unique_reference_id()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_unique_reference_id():
        from AliceTant.models.user import User
        while True:
            ref_id = random.randint(10000000, 99999999)
            if not User.objects.filter(reference_id=ref_id).exists():
                return ref_id
    
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

    def is_admin(self):
        """
        Check if the user is an admin.

        Returns:
            bool: True if user role is ADMIN, False otherwise
        """
        return self.role == UserRole.ADMIN
