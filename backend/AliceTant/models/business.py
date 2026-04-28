"""
Business model for AliceTant application.

This module defines the Business model which represents service offerings
created by providers that customers can search and book.
"""

import random

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
        summary (str): Description / summary of the business (max 4096 characters)
        logo (ImageField): Business logo image file
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
    summary = models.TextField(
        max_length=4096,
        blank=True,
        help_text="Description / summary of the business (max 4096 characters)"
    )
    logo = models.ImageField(
        upload_to='business_logos/',
        blank=True,
        null=True,
        help_text="Business logo image"
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
    reference_id = models.PositiveIntegerField(
        unique=True,
        editable=False,
        null=True,
        help_text="Unique 8-digit reference ID for display"
    )
    is_hidden = models.BooleanField(
        default=False,
        help_text="Whether the business is hidden from public discovery"
    )
    hidden_reason = models.TextField(
        blank=True,
        help_text="Reason the business was hidden"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the business was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the business was last updated"
    )

    def save(self, *args, **kwargs):
        if not self.reference_id:
            self.reference_id = self._generate_unique_reference_id()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_unique_reference_id():
        while True:
            ref_id = random.randint(10000000, 99999999)
            if not Business.objects.filter(reference_id=ref_id).exists():
                return ref_id

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
