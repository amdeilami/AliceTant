"""
Business management views.

This module provides API endpoints for creating, reading, updating,
and deleting businesses for provider users.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from AliceTant.models import Business, Provider
from AliceTant.serializers.business_serializers import BusinessSerializer


class BusinessListCreateView(APIView):
    """
    API view for listing and creating businesses.
    
    GET: Returns all businesses for the authenticated provider
    POST: Creates a new business for the authenticated provider
    
    Permissions:
        - User must be authenticated
        - User must have PROVIDER role
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        List all businesses for the authenticated provider.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: List of businesses with 200 status
            Response: Error message with 403 status if user is not a provider
        """
        # Check if user is a provider
        if request.user.role != 'PROVIDER':
            return Response(
                {'error': 'Only providers can access businesses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get provider profile
            provider = Provider.objects.get(user=request.user)
            
            # Get all businesses for this provider
            businesses = Business.objects.filter(provider=provider)
            
            # Serialize and return
            serializer = BusinessSerializer(businesses, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Provider.DoesNotExist:
            return Response(
                {'error': 'Provider profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def post(self, request):
        """
        Create a new business for the authenticated provider.
        
        Args:
            request: HTTP request object with business data
            
        Returns:
            Response: Created business data with 201 status
            Response: Validation errors with 400 status
            Response: Error message with 403 status if user is not a provider
        """
        # Check if user is a provider
        if request.user.role != 'PROVIDER':
            return Response(
                {'error': 'Only providers can create businesses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get provider profile
            provider = Provider.objects.get(user=request.user)
            
            # Validate and create business
            serializer = BusinessSerializer(data=request.data)
            if serializer.is_valid():
                # Save with provider
                serializer.save(provider=provider)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Provider.DoesNotExist:
            return Response(
                {'error': 'Provider profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class BusinessDetailView(APIView):
    """
    API view for retrieving, updating, and deleting a specific business.
    
    GET: Returns business details
    PUT: Updates business details
    DELETE: Deletes the business
    
    Permissions:
        - User must be authenticated
        - User must be the owner of the business
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_business(self, business_id, user):
        """
        Helper method to get business and verify ownership.
        
        Args:
            business_id (int): ID of the business
            user: Authenticated user
            
        Returns:
            tuple: (business, error_response)
                business: Business object if found and owned by user, None otherwise
                error_response: Response object with error if any, None otherwise
        """
        try:
            business = Business.objects.get(id=business_id)
            
            # Verify ownership
            if business.provider.user != user:
                return None, Response(
                    {'error': 'You do not have permission to access this business'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return business, None
            
        except Business.DoesNotExist:
            return None, Response(
                {'error': 'Business not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def get(self, request, business_id):
        """
        Retrieve business details.
        
        Args:
            request: HTTP request object
            business_id (int): ID of the business
            
        Returns:
            Response: Business data with 200 status
            Response: Error message with appropriate status code
        """
        business, error_response = self.get_business(business_id, request.user)
        if error_response:
            return error_response
        
        serializer = BusinessSerializer(business)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, business_id):
        """
        Update business details.
        
        Args:
            request: HTTP request object with updated business data
            business_id (int): ID of the business
            
        Returns:
            Response: Updated business data with 200 status
            Response: Validation errors with 400 status
            Response: Error message with appropriate status code
        """
        business, error_response = self.get_business(business_id, request.user)
        if error_response:
            return error_response
        
        serializer = BusinessSerializer(business, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, business_id):
        """
        Delete a business.
        
        Args:
            request: HTTP request object
            business_id (int): ID of the business
            
        Returns:
            Response: Success message with 204 status
            Response: Error message with appropriate status code
        """
        business, error_response = self.get_business(business_id, request.user)
        if error_response:
            return error_response
        
        business.delete()
        return Response(
            {'message': 'Business deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
