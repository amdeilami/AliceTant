"""
Views for availability management.

This module contains API views for providers to manage their availability
slots for each business.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from AliceTant.models import Availability, Business
from AliceTant.serializers.availability_serializers import (
    AvailabilitySerializer,
    AvailabilityCreateSerializer
)


class AvailabilityListView(APIView):
    """
    API view for listing and creating availability slots.
    
    GET: List all availability slots for a specific business
    POST: Create multiple availability slots for a business
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get all availability slots for a specific business.
        
        Query Parameters:
            business_id (int): ID of the business to fetch availability for
        
        Returns:
            Response: List of availability slots
        """
        business_id = request.query_params.get('business_id')
        
        if not business_id:
            return Response(
                {'error': 'business_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            return Response(
                {'error': 'Business not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if the business belongs to the current provider
        if business.provider.user != request.user:
            return Response(
                {'error': 'You don\'t have permission to view this business\'s availability.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all availability slots for this business
        availability_slots = Availability.objects.filter(business=business)
        serializer = AvailabilitySerializer(availability_slots, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        """
        Create multiple availability slots for a business.
        
        This endpoint replaces all existing availability slots for the business
        with the new slots provided.
        
        Request Body:
            business_id (int): ID of the business
            slots (list): List of availability slot objects
        
        Returns:
            Response: Created availability slots
        """
        serializer = AvailabilityCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        business_id = serializer.validated_data['business_id']
        slots = serializer.validated_data['slots']
        
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            return Response(
                {'error': 'Business not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Use transaction to ensure all slots are created or none
        with transaction.atomic():
            # Delete existing availability slots for this business
            Availability.objects.filter(business=business).delete()
            
            # Create new availability slots
            created_slots = []
            for slot_data in slots:
                availability = Availability.objects.create(
                    business=business,
                    day_of_week=slot_data['day_of_week'],
                    start_time=slot_data['start_time'],
                    end_time=slot_data['end_time']
                )
                created_slots.append(availability)
        
        # Serialize and return created slots
        result_serializer = AvailabilitySerializer(created_slots, many=True)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


class AvailabilityDetailView(APIView):
    """
    API view for retrieving, updating, and deleting individual availability slots.
    
    GET: Retrieve a specific availability slot
    PUT: Update a specific availability slot
    DELETE: Delete a specific availability slot
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_object(self, availability_id, user):
        """
        Get availability object and verify ownership.
        
        Args:
            availability_id (int): ID of the availability slot
            user (User): Current user
            
        Returns:
            Availability: Availability object if found and owned by user
            
        Raises:
            Availability.DoesNotExist: If availability not found
        """
        availability = Availability.objects.get(id=availability_id)
        
        # Check if the availability's business belongs to the current provider
        if availability.business.provider.user != user:
            raise PermissionError("You don't have permission to access this availability.")
        
        return availability
    
    def get(self, request, availability_id):
        """
        Retrieve a specific availability slot.
        
        Args:
            availability_id (int): ID of the availability slot
            
        Returns:
            Response: Availability slot data
        """
        try:
            availability = self.get_object(availability_id, request.user)
        except Availability.DoesNotExist:
            return Response(
                {'error': 'Availability not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AvailabilitySerializer(availability)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, availability_id):
        """
        Update a specific availability slot.
        
        Args:
            availability_id (int): ID of the availability slot
            
        Returns:
            Response: Updated availability slot data
        """
        try:
            availability = self.get_object(availability_id, request.user)
        except Availability.DoesNotExist:
            return Response(
                {'error': 'Availability not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AvailabilitySerializer(
            availability,
            data=request.data,
            partial=True
        )
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def delete(self, request, availability_id):
        """
        Delete a specific availability slot.
        
        Args:
            availability_id (int): ID of the availability slot
            
        Returns:
            Response: Success message
        """
        try:
            availability = self.get_object(availability_id, request.user)
        except Availability.DoesNotExist:
            return Response(
                {'error': 'Availability not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        
        availability.delete()
        return Response(
            {'message': 'Availability deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )
