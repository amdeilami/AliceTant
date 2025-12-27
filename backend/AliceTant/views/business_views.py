"""
Business management views.

This module provides API endpoints for creating, reading, updating,
and deleting businesses for provider users using Django REST Framework ViewSet.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from AliceTant.models import Business, Provider
from AliceTant.serializers.business_serializers import BusinessSerializer
from AliceTant.services.business_service import BusinessService
from AliceTant.exceptions.user_exceptions import (
    BusinessNotFoundError,
    UnauthorizedAccessError,
    InvalidUserDataError
)


class BusinessViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing businesses.
    
    Provides CRUD operations for businesses with proper authorization,
    logo upload support, and search/filter functionality.
    
    Permissions:
        - User must be authenticated
        - Users can only access/modify their own businesses (except for public search)
    
    Features:
        - Create businesses with logo upload
        - Update businesses with ownership verification
        - Delete businesses with ownership verification
        - Search businesses by name or summary
        - Filter businesses by various criteria
    """
    
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'summary', 'description']
    filterset_fields = ['provider__user__username']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get queryset based on user role and action.
        
        Returns:
            QuerySet: Filtered queryset based on user permissions
        """
        user = self.request.user
        
        # For search action, return all businesses (public)
        if self.action == 'search':
            return Business.objects.all()
        
        # For provider users, return only their businesses
        if hasattr(user, 'role') and user.role == 'PROVIDER':
            try:
                provider = Provider.objects.get(user=user)
                return Business.objects.filter(provider=provider)
            except Provider.DoesNotExist:
                return Business.objects.none()
        
        # For other users (customers), return all businesses for browsing
        return Business.objects.all()
    
    def create(self, request, *args, **kwargs):
        """
        Create a new business for the authenticated provider.
        
        Handles logo upload and uses BusinessService for creation with validation.
        
        Args:
            request: HTTP request object with business data and optional logo file
            
        Returns:
            Response: Created business data with 201 status
            Response: Validation errors with 400 status
            Response: Error message with 403 status if user is not a provider
        """
        # Check if user is a provider
        if not hasattr(request.user, 'role') or request.user.role != 'PROVIDER':
            return Response(
                {'error': 'Only providers can create businesses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get provider profile
            provider = Provider.objects.get(user=request.user)
            
            # Extract data from request
            data = request.data.copy()
            logo = request.FILES.get('logo')
            
            # Use BusinessService to create business
            business = BusinessService.create_business_for_provider(
                provider=provider,
                name=data.get('name', ''),
                summary=data.get('summary', ''),
                logo=logo,
                description=data.get('description', ''),
                phone=data.get('phone', ''),
                email=data.get('email', ''),
                address=data.get('address', '')
            )
            
            # Serialize and return the created business
            serializer = self.get_serializer(business, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Provider.DoesNotExist:
            return Response(
                {'error': 'Provider profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except InvalidUserDataError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'An error occurred while creating the business'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """
        Update business details with ownership verification.
        
        Handles logo upload and uses BusinessService for updates with authorization.
        
        Args:
            request: HTTP request object with updated business data
            
        Returns:
            Response: Updated business data with 200 status
            Response: Validation errors with 400 status
            Response: Error message with appropriate status code
        """
        # Check if user is a provider
        if not hasattr(request.user, 'role') or request.user.role != 'PROVIDER':
            return Response(
                {'error': 'Only providers can update businesses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get provider profile
            provider = Provider.objects.get(user=request.user)
            business_id = kwargs.get('pk')
            
            # Extract data from request
            data = request.data.copy()
            update_fields = {}
            
            # Add fields that are present in the request
            for field in ['name', 'summary', 'description', 'phone', 'email', 'address']:
                if field in data:
                    update_fields[field] = data[field]
            
            # Handle logo upload
            if 'logo' in request.FILES:
                update_fields['logo'] = request.FILES['logo']
            
            # Use BusinessService to update business
            business = BusinessService.update_business_for_provider(
                business_id=business_id,
                provider=provider,
                **update_fields
            )
            
            # Serialize and return the updated business
            serializer = self.get_serializer(business, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Provider.DoesNotExist:
            return Response(
                {'error': 'Provider profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except BusinessNotFoundError:
            return Response(
                {'error': 'Business not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except UnauthorizedAccessError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except InvalidUserDataError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'An error occurred while updating the business'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete a business with ownership verification.
        
        Uses BusinessService to delete business with proper authorization checks.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: Success message with 204 status
            Response: Error message with appropriate status code
        """
        # Check if user is a provider
        if not hasattr(request.user, 'role') or request.user.role != 'PROVIDER':
            return Response(
                {'error': 'Only providers can delete businesses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get provider profile
            provider = Provider.objects.get(user=request.user)
            business_id = kwargs.get('pk')
            
            # Use BusinessService to delete business
            BusinessService.delete_business_for_provider(
                business_id=business_id,
                provider=provider
            )
            
            return Response(
                {'message': 'Business deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
        except Provider.DoesNotExist:
            return Response(
                {'error': 'Provider profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except BusinessNotFoundError:
            return Response(
                {'error': 'Business not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except UnauthorizedAccessError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {'error': 'An error occurred while deleting the business'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[])
    def search(self, request):
        """
        Search businesses by name or summary (public endpoint).
        
        Allows customers to search for businesses without authentication.
        Supports query parameter 'q' for search terms.
        
        Args:
            request: HTTP request object with optional 'q' query parameter
            
        Returns:
            Response: List of matching businesses with 200 status
        """
        query = request.query_params.get('q', '')
        
        if not query:
            # Return all businesses if no query provided
            businesses = BusinessService.get_all_businesses(limit=50)
        else:
            # Search businesses using the service
            businesses = BusinessService.search_businesses(query)
        
        # Serialize and return results
        serializer = self.get_serializer(businesses, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def my_businesses(self, request):
        """
        Get all businesses for the authenticated provider.
        
        Convenience endpoint for providers to get their businesses.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: List of provider's businesses with 200 status
            Response: Error message with 403 status if user is not a provider
        """
        # Check if user is a provider
        if not hasattr(request.user, 'role') or request.user.role != 'PROVIDER':
            return Response(
                {'error': 'Only providers can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get provider profile
            provider = Provider.objects.get(user=request.user)
            
            # Get businesses using the service
            businesses = BusinessService.get_provider_businesses(provider)
            
            # Serialize and return results
            serializer = self.get_serializer(businesses, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Provider.DoesNotExist:
            return Response(
                {'error': 'Provider profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )



