"""
Business model for AliceTant application.

This module defines the Business model which represents service offerings
created by providers that customers can search and book.
"""

from django.db import models
from .provider import Provider


class Business(models.Model):
    """
    Business model representing a service offering by a provider.
    
    Each provider can create multiple businesses. Customers can search
    for and book appointments with these businesses.
    
    Attributes:
        provider (Provider): Foreign key to the Provider who owns this business
        name (str): Name of the business/service
        summary (str): Brief description of the business (max 512 characters)
        logo (ImageField): Business logo image file
        description (str): Detailed description of the business
        phone (str): Contact phone number for the business
        email (str): Contact email for the business
        address (str): Physical address of the business
        created_at (datetime): Timestamp when the business was created
        updated_at (datetime): Timestamp when the business was last updated
    """
    
    provider = models.ForeignKey(
        Provider,
        on_delete=models.CASCADE,
        related_name='businesses',
        help_text="Provider who owns this business"
    )
    name = models.CharField(
        max_length=200,
        help_text="Name of the business/service"
    )
    summary = models.CharField(
        max_length=512,
        blank=True,
        help_text="Brief description of the business (max 512 characters)"
    )
    logo = models.ImageField(
        upload_to='business_logos/',
        blank=True,
        null=True,
        help_text="Business logo image"
    )
    description = models.TextField(
        max_length=2000,
        help_text="Detailed description of the business"
    )
    phone = models.CharField(
        max_length=20,
        help_text="Contact phone number"
    )
    email = models.EmailField(
        help_text="Contact email address"
    )
    address = models.TextField(
        help_text="Physical address of the business"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the business was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the business was last updated"
    )
    
    class Meta:
        db_table = 'alicetant_business'
        verbose_name = 'Business'
        verbose_name_plural = 'Businesses'
        ordering = ['-created_at']
    
    def __str__(self):
        """
        String representation of the Business.
        
        Returns:
            str: Business name and provider username
        """
        return f"{self.name} (Provider: {self.provider.user.username})"
