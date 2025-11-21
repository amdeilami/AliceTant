"""
Provider model for AliceTant application.

This module defines the Provider model which extends user accounts with
business-specific information for service providers.
"""

from django.db import models
from .user import User


class Provider(models.Model):
    """
    Provider profile model for business owners.
    
    Stores business-specific information for users with the PROVIDER role.
    Has a one-to-one relationship with the User model.
    
    Attributes:
        user (User): One-to-one relationship to User model (primary key)
        business_name (str): Name of the provider's business
        bio (str): Business description (max 4096 characters)
        phone_number (str): Contact phone number
        address (str): Business address
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='provider_profile'
    )
    business_name = models.CharField(
        max_length=200,
        help_text="Name of the business"
    )
    bio = models.TextField(
        max_length=4096,
        blank=True,
        help_text="Business description (max 4096 characters)"
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        help_text="Contact phone number"
    )
    address = models.TextField(
        blank=True,
        help_text="Business address"
    )
    
    class Meta:
        db_table = 'alicetant_provider'
        verbose_name = 'Provider'
        verbose_name_plural = 'Providers'
    
    def __str__(self):
        """
        String representation of the Provider.
        
        Returns:
            str: Business name and associated username
        """
        return f"{self.business_name} ({self.user.username})"
