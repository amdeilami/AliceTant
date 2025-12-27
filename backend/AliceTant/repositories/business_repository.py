"""
Business repository for AliceTant application.

This module provides a repository layer that abstracts database operations
for business management, including CRUD operations and queries. It translates
Django ORM exceptions into domain-specific exceptions.
"""

from typing import List, Optional
from django.db import IntegrityError
from django.core.files.uploadedfile import UploadedFile
from django.db.models import Q

from ..models import Business, Provider
from ..exceptions.user_exceptions import (
    BusinessNotFoundError,
    UnauthorizedAccessError,
    InvalidUserDataError
)


class BusinessRepository:
    """
    Repository for business data access operations.
    
    Abstracts database operations from business logic, providing a clean
    interface for business management. All methods are static as the repository
    maintains no state.
    """
    
    @staticmethod
    def create_business(
        provider: Provider,
        name: str,
        summary: str = "",
        logo: Optional[UploadedFile] = None,
        **extra_fields
    ) -> Business:
        """
        Create a new business for a provider.
        
        Creates a business entity with the specified information and associates
        it with the given provider. Handles logo file upload if provided.
        
        Args:
            provider (Provider): Provider who will own this business
            name (str): Name of the business/service
            summary (str): Brief description (max 512 characters, default: "")
            logo (UploadedFile): Logo image file (optional)
            **extra_fields: Additional fields like description, phone, email, address
        
        Returns:
            Business: The newly created business instance
        
        Raises:
            InvalidUserDataError: If validation fails for any field
        """
        # Validate name is not empty
        if not name or not name.strip():
            raise InvalidUserDataError("Business name cannot be empty")
        
        # Validate summary length
        if len(summary) > 512:
            raise InvalidUserDataError(
                f"Summary exceeds maximum length of 512 characters (got {len(summary)})"
            )
        
        try:
            business = Business.objects.create(
                provider=provider,
                name=name.strip(),
                summary=summary,
                logo=logo,
                **extra_fields
            )
            return business
        except IntegrityError as e:
            raise InvalidUserDataError(f"Database integrity error: {str(e)}")
        except Exception as e:
            raise InvalidUserDataError(f"Failed to create business: {str(e)}")
    
    @staticmethod
    def get_business_by_id(business_id: int) -> Business:
        """
        Retrieve business by ID.
        
        Args:
            business_id (int): The ID of the business to retrieve
        
        Returns:
            Business: The business instance with the specified ID
        
        Raises:
            BusinessNotFoundError: If no business exists with the given ID
        """
        try:
            return Business.objects.select_related('provider__user').get(id=business_id)
        except Business.DoesNotExist:
            raise BusinessNotFoundError(f"Business with ID {business_id} not found")
    
    @staticmethod
    def get_businesses_by_provider(provider: Provider) -> List[Business]:
        """
        Retrieve all businesses owned by a provider.
        
        Args:
            provider (Provider): The provider whose businesses to retrieve
        
        Returns:
            List[Business]: List of businesses owned by the provider, ordered by creation date
        """
        return list(Business.objects.filter(provider=provider).order_by('-created_at'))
    
    @staticmethod
    def get_all_businesses(limit: int = 100, offset: int = 0) -> List[Business]:
        """
        Retrieve all businesses with pagination.
        
        Args:
            limit (int): Maximum number of businesses to return (default: 100)
            offset (int): Number of businesses to skip (default: 0)
        
        Returns:
            List[Business]: List of businesses within the specified pagination range
        """
        return list(
            Business.objects
            .select_related('provider__user')
            .order_by('-created_at')[offset:offset + limit]
        )
    
    @staticmethod
    def search_businesses(query: str) -> List[Business]:
        """
        Search businesses by name or summary.
        
        Performs a case-insensitive search across business name and summary fields.
        
        Args:
            query (str): Search query string
        
        Returns:
            List[Business]: List of businesses matching the search query
        """
        if not query or not query.strip():
            return []
        
        query = query.strip()
        return list(
            Business.objects
            .select_related('provider__user')
            .filter(
                Q(name__icontains=query) | Q(summary__icontains=query)
            )
            .order_by('-created_at')
        )
    
    @staticmethod
    def update_business(business: Business, **fields) -> Business:
        """
        Update business fields.
        
        Updates the specified fields on the business instance and saves to database.
        Validates constraints before persisting changes.
        
        Args:
            business (Business): The business instance to update
            **fields: Fields to update (e.g., name='New Name', summary='New summary')
        
        Returns:
            Business: The updated business instance
        
        Raises:
            InvalidUserDataError: If validation fails
        """
        # Validate name if being updated
        if 'name' in fields:
            name = fields['name']
            if not name or not name.strip():
                raise InvalidUserDataError("Business name cannot be empty")
            fields['name'] = name.strip()
        
        # Validate summary length if being updated
        if 'summary' in fields:
            summary = fields['summary']
            if len(summary) > 512:
                raise InvalidUserDataError(
                    f"Summary exceeds maximum length of 512 characters (got {len(summary)})"
                )
        
        try:
            # Update fields
            for field, value in fields.items():
                setattr(business, field, value)
            
            business.save()
            return business
        except IntegrityError as e:
            raise InvalidUserDataError(f"Database integrity error: {str(e)}")
        except Exception as e:
            raise InvalidUserDataError(f"Failed to update business: {str(e)}")
    
    @staticmethod
    def delete_business(business_id: int, provider: Provider) -> bool:
        """
        Delete business if owned by provider.
        
        Deletes the business with the specified ID after verifying that the
        provider owns it. Associated appointments and logo files are automatically
        deleted due to CASCADE delete constraint and Django's file field cleanup.
        
        Args:
            business_id (int): The ID of the business to delete
            provider (Provider): The provider attempting to delete the business
        
        Returns:
            bool: True if business was deleted
        
        Raises:
            BusinessNotFoundError: If no business exists with the given ID
            UnauthorizedAccessError: If provider does not own the business
        """
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            raise BusinessNotFoundError(f"Business with ID {business_id} not found")
        
        # Verify ownership
        if not BusinessRepository.verify_ownership(business, provider):
            raise UnauthorizedAccessError(
                f"Provider {provider.user.username} is not authorized to delete "
                f"business {business_id}"
            )
        
        # Delete logo file if it exists
        if business.logo:
            business.logo.delete(save=False)
        
        business.delete()
        return True
    
    @staticmethod
    def verify_ownership(business: Business, provider: Provider) -> bool:
        """
        Verify that provider owns the business.
        
        Args:
            business (Business): The business to check ownership for
            provider (Provider): The provider to verify ownership against
        
        Returns:
            bool: True if provider owns the business, False otherwise
        """
        return business.provider.user.id == provider.user.id
