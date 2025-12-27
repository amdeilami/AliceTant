"""
Business service for AliceTant application.

This module provides the service layer for business operations, implementing
business logic, authorization checks, and validation. It acts as an intermediary
between the API layer and the repository layer.
"""

from typing import List, Optional
from django.core.files.uploadedfile import UploadedFile

from ..models import Business, Provider
from ..repositories.business_repository import BusinessRepository
from ..exceptions.user_exceptions import (
    BusinessNotFoundError,
    UnauthorizedAccessError,
    InvalidUserDataError
)


class BusinessService:
    """
    Service layer for business operations with authorization checks.
    
    Provides business logic and authorization for business management operations.
    All business operations go through this service to ensure proper validation
    and authorization before delegating to the repository layer.
    """
    
    @staticmethod
    def create_business_for_provider(
        provider: Provider,
        name: str,
        summary: str = "",
        logo: Optional[UploadedFile] = None,
        **extra_fields
    ) -> Business:
        """
        Create a business with validation for a provider.
        
        Validates business data and creates a new business entity associated
        with the specified provider. Performs comprehensive validation including
        summary length constraints.
        
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
        # Validate provider exists and is valid
        if not provider:
            raise InvalidUserDataError("Provider is required")
        
        # Validate business name
        if not name or not name.strip():
            raise InvalidUserDataError("Business name is required and cannot be empty")
        
        # Validate summary length (this is also done in repository, but we check here for service-level validation)
        if len(summary) > 512:
            raise InvalidUserDataError(
                f"Business summary exceeds maximum length of 512 characters (got {len(summary)})"
            )
        
        # Delegate to repository for creation
        return BusinessRepository.create_business(
            provider=provider,
            name=name,
            summary=summary,
            logo=logo,
            **extra_fields
        )
    
    @staticmethod
    def update_business_for_provider(
        business_id: int,
        provider: Provider,
        **fields
    ) -> Business:
        """
        Update business with ownership verification.
        
        Updates the specified business after verifying that the provider owns it.
        Validates all field updates before persisting changes.
        
        Args:
            business_id (int): ID of the business to update
            provider (Provider): Provider attempting to update the business
            **fields: Fields to update (e.g., name='New Name', summary='New summary')
        
        Returns:
            Business: The updated business instance
        
        Raises:
            BusinessNotFoundError: If no business exists with the given ID
            UnauthorizedAccessError: If provider does not own the business
            InvalidUserDataError: If validation fails for any field
        """
        # Validate provider exists
        if not provider:
            raise InvalidUserDataError("Provider is required")
        
        # Get the business (will raise BusinessNotFoundError if not found)
        business = BusinessRepository.get_business_by_id(business_id)
        
        # Verify ownership
        if not BusinessRepository.verify_ownership(business, provider):
            raise UnauthorizedAccessError(
                f"Provider {provider.user.username} is not authorized to update "
                f"business {business_id}"
            )
        
        # Validate fields before updating
        if 'name' in fields:
            name = fields['name']
            if not name or not name.strip():
                raise InvalidUserDataError("Business name cannot be empty")
        
        if 'summary' in fields:
            summary = fields['summary']
            if len(summary) > 512:
                raise InvalidUserDataError(
                    f"Business summary exceeds maximum length of 512 characters (got {len(summary)})"
                )
        
        # Delegate to repository for update
        return BusinessRepository.update_business(business, **fields)
    
    @staticmethod
    def delete_business_for_provider(
        business_id: int,
        provider: Provider
    ) -> bool:
        """
        Delete business with ownership verification.
        
        Deletes the specified business after verifying that the provider owns it.
        This will also delete all associated appointments and logo files.
        
        Args:
            business_id (int): ID of the business to delete
            provider (Provider): Provider attempting to delete the business
        
        Returns:
            bool: True if business was successfully deleted
        
        Raises:
            BusinessNotFoundError: If no business exists with the given ID
            UnauthorizedAccessError: If provider does not own the business
        """
        # Validate provider exists
        if not provider:
            raise InvalidUserDataError("Provider is required")
        
        # Delegate to repository (it will handle ownership verification)
        return BusinessRepository.delete_business(business_id, provider)
    
    @staticmethod
    def get_provider_businesses(provider: Provider) -> List[Business]:
        """
        Get all businesses for a provider.
        
        Retrieves all businesses owned by the specified provider, ordered by
        creation date (most recent first).
        
        Args:
            provider (Provider): Provider whose businesses to retrieve
        
        Returns:
            List[Business]: List of businesses owned by the provider
        
        Raises:
            InvalidUserDataError: If provider is not provided
        """
        # Validate provider exists
        if not provider:
            raise InvalidUserDataError("Provider is required")
        
        # Delegate to repository
        return BusinessRepository.get_businesses_by_provider(provider)
    
    @staticmethod
    def get_business_by_id_for_provider(
        business_id: int,
        provider: Provider
    ) -> Business:
        """
        Get a specific business for a provider with ownership verification.
        
        Retrieves the business with the specified ID after verifying that the
        provider owns it.
        
        Args:
            business_id (int): ID of the business to retrieve
            provider (Provider): Provider attempting to access the business
        
        Returns:
            Business: The business instance
        
        Raises:
            BusinessNotFoundError: If no business exists with the given ID
            UnauthorizedAccessError: If provider does not own the business
        """
        # Validate provider exists
        if not provider:
            raise InvalidUserDataError("Provider is required")
        
        # Get the business (will raise BusinessNotFoundError if not found)
        business = BusinessRepository.get_business_by_id(business_id)
        
        # Verify ownership
        if not BusinessRepository.verify_ownership(business, provider):
            raise UnauthorizedAccessError(
                f"Provider {provider.user.username} is not authorized to access "
                f"business {business_id}"
            )
        
        return business
    
    @staticmethod
    def search_businesses(query: str) -> List[Business]:
        """
        Search businesses by name or summary (public operation).
        
        Performs a search across all businesses for the given query string.
        This is a public operation that doesn't require authorization.
        
        Args:
            query (str): Search query string
        
        Returns:
            List[Business]: List of businesses matching the search query
        """
        # Delegate to repository
        return BusinessRepository.search_businesses(query)
    
    @staticmethod
    def get_all_businesses(limit: int = 100, offset: int = 0) -> List[Business]:
        """
        Get all businesses with pagination (public operation).
        
        Retrieves all businesses with pagination support. This is a public
        operation that doesn't require authorization.
        
        Args:
            limit (int): Maximum number of businesses to return (default: 100)
            offset (int): Number of businesses to skip (default: 0)
        
        Returns:
            List[Business]: List of businesses within the specified pagination range
        """
        # Validate pagination parameters
        if limit < 1:
            raise InvalidUserDataError("Limit must be at least 1")
        if offset < 0:
            raise InvalidUserDataError("Offset must be non-negative")
        
        # Delegate to repository
        return BusinessRepository.get_all_businesses(limit, offset)