"""
Views for availability management.

This module contains API views for providers to manage their availability
slots for each business.
"""

import uuid
from datetime import datetime, timedelta

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction, IntegrityError

from AliceTant.models import Availability, Business
from AliceTant.serializers.availability_serializers import (
    AvailabilitySerializer,
    AvailabilityCreateSerializer
)
from AliceTant.views.auth_views import JWTAuthentication


class AvailabilityListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
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
        
        if business.provider.user != request.user:
            return Response(
                {'error': 'You don\'t have permission to view this business\'s availability.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        availability_slots = Availability.objects.filter(business=business)
        serializer = AvailabilitySerializer(availability_slots, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        """
        Create availability slots. Supports recurring weekly expansion.

        If overlaps are found with existing slots:
          - Without force_overwrite: returns 409 with conflict details
          - With force_overwrite=true: deletes conflicting existing slots, then creates new ones
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
        force_overwrite = request.data.get('force_overwrite', False)
        
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            return Response(
                {'error': 'Business not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Expand recurring slots
        to_create = []
        for slot_data in slots:
            slot_date = datetime.strptime(slot_data['date'], '%Y-%m-%d').date()
            is_recurring = slot_data.get('is_recurring', False)
            num_weeks = int(slot_data.get('num_weeks', 1)) if is_recurring else 1
            group_id = uuid.uuid4() if is_recurring and num_weeks > 1 else None
            capacity = slot_data.get('capacity')
            if capacity is not None:
                capacity = int(capacity)
            else:
                capacity = None

            for w in range(num_weeks):
                d = slot_date + timedelta(weeks=w)
                to_create.append(Availability(
                    business=business,
                    date=d,
                    start_time=slot_data['start_time'],
                    end_time=slot_data['end_time'],
                    capacity=capacity or None,
                    recurring_group=group_id,
                ))

        # Build existing slots map
        existing = Availability.objects.filter(business=business)
        existing_map = {}  # date -> [(start, end, id)]
        for ex in existing:
            existing_map.setdefault(ex.date, []).append(
                (ex.start_time, ex.end_time, ex.id)
            )

        # Find overlaps
        conflicts = []  # list of (new_item, conflicting_existing_id, description)
        conflicting_ids = set()
        for item in to_create:
            new_start = datetime.strptime(item.start_time, '%H:%M').time() if isinstance(item.start_time, str) else item.start_time
            new_end = datetime.strptime(item.end_time, '%H:%M').time() if isinstance(item.end_time, str) else item.end_time
            for ex_start, ex_end, ex_id in existing_map.get(item.date, []):
                if new_start < ex_end and new_end > ex_start:
                    conflicts.append({
                        'date': str(item.date),
                        'new_time': f"{new_start.strftime('%H:%M')}-{new_end.strftime('%H:%M')}",
                        'existing_time': f"{ex_start.strftime('%H:%M')}-{ex_end.strftime('%H:%M')}",
                        'existing_id': ex_id,
                    })
                    conflicting_ids.add(ex_id)

        # If there are overlaps and user hasn't confirmed overwrite, return warning
        if conflicts and not force_overwrite:
            return Response({
                'warning': 'Some new slots overlap with existing availability.',
                'conflicts': conflicts,
            }, status=status.HTTP_409_CONFLICT)

        # If force_overwrite, delete the conflicting existing slots first
        with transaction.atomic():
            if conflicts and force_overwrite:
                Availability.objects.filter(id__in=conflicting_ids).delete()

            created_slots = []
            # Track what we're adding for intra-batch overlap detection
            added_map = {}
            for item in to_create:
                new_start = datetime.strptime(item.start_time, '%H:%M').time() if isinstance(item.start_time, str) else item.start_time
                new_end = datetime.strptime(item.end_time, '%H:%M').time() if isinstance(item.end_time, str) else item.end_time
                # Check intra-batch overlap
                intra_overlap = False
                for a_start, a_end in added_map.get(item.date, []):
                    if new_start < a_end and new_end > a_start:
                        intra_overlap = True
                        break
                if intra_overlap:
                    continue
                item.save()
                created_slots.append(item)
                added_map.setdefault(item.date, []).append((new_start, new_end))
        
        result_serializer = AvailabilitySerializer(created_slots, many=True)
        return Response({
            'created': result_serializer.data,
        }, status=status.HTTP_201_CREATED)


class AvailabilityDetailView(APIView):
    """
    API view for retrieving, updating, and deleting individual availability slots.
    
    GET: Retrieve a specific availability slot
    PUT: Update a specific availability slot
    DELETE: Delete a specific availability slot
    """
    
    authentication_classes = [JWTAuthentication]
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
