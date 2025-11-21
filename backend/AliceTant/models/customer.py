"""
Customer model for AliceTant application.

This module defines the Customer model which extends user accounts with
customer-specific information for appointment booking.
"""

from django.db import models
from .user import User


class Customer(models.Model):
    """
    Customer profile model for appointment booking clients.
    
    Stores customer-specific information for users with the CUSTOMER role.
    Has a one-to-one relationship with the User model.
    
    Attributes:
        user (User): One-to-one relationship to User model (primary key)
        full_name (str): Customer's full name
        phone_number (str): Contact phone number
        preferences (str): Optional customer preferences for appointments
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='customer_profile'
    )
    full_name = models.CharField(
        max_length=200,
        help_text="Customer's full name"
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        help_text="Contact phone number"
    )
    preferences = models.TextField(
        blank=True,
        help_text="Optional customer preferences for appointments"
    )
    
    class Meta:
        db_table = 'alicetant_customer'
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'
    
    def __str__(self):
        """
        String representation of the Customer.
        
        Returns:
            str: Full name and associated username
        """
        return f"{self.full_name} ({self.user.username})"
