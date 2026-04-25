"""
Appointment views for AliceTant application.

This module provides API endpoints for managing appointments using Django REST Framework ViewSets.
Implements full CRUD operations with role-based filtering and authorization.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from datetime import datetime, date

from ..models import Appointment, Customer, Provider, Availability
from ..serializers.appointment_serializers import AppointmentSerializer
from ..services.appointment_service import AppointmentService
from ..repositories.appointment_repository import AppointmentRepository
from ..views.auth_views import JWTAuthentication
from ..exceptions.user_exceptions import (
    InvalidAppointmentDataError,
    TimeSlotConflictError,
    BusinessNotFoundError,
    UnauthorizedAccessError
)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing appointments with role-based filtering.
    
    Provides CRUD operations for appointments with automatic filtering based on user role:
    - Customers see only their own appointments
    - Providers see appointments for their businesses
    
    Endpoints:
        GET /api/appointments/ - List appointments (filtered by role)
        POST /api/appointments/ - Create new appointment
        GET /api/appointments/{id}/ - Retrieve specific appointment
        PUT /api/appointments/{id}/ - Update appointment (limited)
        DELETE /api/appointments/{id}/ - Delete appointment (not allowed)
        POST /api/appointments/{id}/cancel/ - Cancel appointment
    
    Query Parameters:
        business: Filter by business ID (providers only)
        start_date: Filter appointments from this date (YYYY-MM-DD)
        end_date: Filter appointments until this date (YYYY-MM-DD)
        status: Filter by appointment status (ACTIVE, CANCELLED)
    """
    
    serializer_class = AppointmentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']
    
    def get_queryset(self):
        """
        Get appointments filtered by user role and query parameters.
        
        Returns:
            QuerySet: Filtered appointments based on user role and parameters
        """
        user = self.request.user
        queryset = Appointment.objects.select_related('business').prefetch_related('customers')
        
        # Filter by user role
        if user.is_customer():
            # Customers see only their own appointments
            try:
                customer = Customer.objects.get(user=user)
                queryset = queryset.filter(customers=customer)
            except Customer.DoesNotExist:
                # Return empty queryset if customer profile doesn't exist
                return Appointment.objects.none()
                
        elif user.is_provider():
            # Providers see appointments for their businesses
            try:
                provider = Provider.objects.get(user=user)
                queryset = queryset.filter(business__provider=provider)
            except Provider.DoesNotExist:
                # Return empty queryset if provider profile doesn't exist
                return Appointment.objects.none()
        else:
            # Unknown role, return empty queryset
            return Appointment.objects.none()
        
        # Apply additional filters from query parameters
        business_id = self.request.query_params.get('business', None)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        # Filter by business (providers only)
        if business_id and user.is_provider():
            try:
                business_id = int(business_id)
                queryset = queryset.filter(business_id=business_id)
            except (ValueError, TypeError):
                # Invalid business ID, ignore filter
                pass
        
        # Filter by date range
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(appointment_date__gte=start_date)
            except ValueError:
                # Invalid date format, ignore filter
                pass
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(appointment_date__lte=end_date)
            except ValueError:
                # Invalid date format, ignore filter
                pass
        
        # Order by date and time
        return queryset.order_by('appointment_date', 'appointment_time')
    
    def list(self, request, *args, **kwargs):
        """
        List appointments with role-based filtering.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: JSON array of appointments
        """
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve appointments: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        """
        Create a new appointment using AppointmentService.
        
        Args:
            request: HTTP request object with appointment data
            
        Returns:
            Response: Created appointment data or error message
        """
        try:
            # Extract data from request
            business_id = request.data.get('business')
            customer_ids = request.data.get('customers', [])
            appointment_date_str = request.data.get('appointment_date')
            appointment_time_str = request.data.get('appointment_time')
            end_time_str = request.data.get('end_time')
            availability_id = request.data.get('availability')
            notes = request.data.get('notes', '')
            
            # Validate required fields
            if not business_id:
                return Response(
                    {'error': 'Business ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not customer_ids:
                return Response(
                    {'error': 'At least one customer is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not appointment_date_str:
                return Response(
                    {'error': 'Appointment date is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not appointment_time_str:
                return Response(
                    {'error': 'Appointment time is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse date and time
            try:
                appointment_date = datetime.strptime(appointment_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                appointment_time = datetime.strptime(appointment_time_str, '%H:%M').time()
            except ValueError:
                return Response(
                    {'error': 'Invalid time format. Use HH:MM'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse optional end_time
            end_time = None
            if end_time_str:
                try:
                    end_time = datetime.strptime(end_time_str, '%H:%M').time()
                except ValueError:
                    return Response(
                        {'error': 'Invalid end_time format. Use HH:MM'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create appointment using service
            appointment = AppointmentService.book_appointment(
                business_id=int(business_id),
                customer_ids=[int(cid) for cid in customer_ids],
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                end_time=end_time,
                availability_id=int(availability_id) if availability_id else None,
                notes=notes
            )
            
            # Serialize and return created appointment
            serializer = self.get_serializer(appointment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except (ValueError, TypeError) as e:
            return Response(
                {'error': f'Invalid data format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except BusinessNotFoundError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except InvalidAppointmentDataError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except TimeSlotConflictError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_409_CONFLICT
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to create appointment: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific appointment with authorization check.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: Appointment data or error message
        """
        try:
            appointment = self.get_object()
            serializer = self.get_serializer(appointment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve appointment: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """
        Update appointment (limited functionality).
        
        Only allows updating notes field. Other fields require cancellation and rebooking.
        
        Args:
            request: HTTP request object with update data
            
        Returns:
            Response: Updated appointment data or error message
        """
        try:
            appointment = self.get_object()
            
            # Only allow updating notes
            notes = request.data.get('notes', appointment.notes)
            appointment.notes = notes
            appointment.save()
            
            serializer = self.get_serializer(appointment)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to update appointment: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        Prevent deletion of appointments.
        
        Appointments should be cancelled, not deleted, to preserve history.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: Error message indicating deletion is not allowed
        """
        return Response(
            {'error': 'Appointments cannot be deleted. Use the cancel action instead.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """
        Reschedule an appointment (change date and/or time).
        
        Only providers who own the business can reschedule.
        
        Args:
            request: HTTP request with new appointment_date and/or appointment_time
            pk: Appointment ID
            
        Returns:
            Response: Updated appointment data or error message
        """
        try:
            appointment = self.get_object()
            user = request.user
            
            # Only providers can reschedule
            if not user.is_provider():
                return Response(
                    {'error': 'Only providers can reschedule appointments'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Verify provider owns the business
            try:
                provider = Provider.objects.get(user=user)
            except Provider.DoesNotExist:
                return Response(
                    {'error': 'Provider profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if appointment.business.provider != provider:
                return Response(
                    {'error': 'You are not authorized to reschedule this appointment'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Can only reschedule active appointments
            if appointment.status != 'ACTIVE':
                return Response(
                    {'error': 'Only active appointments can be rescheduled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            new_date_str = request.data.get('appointment_date')
            new_time_str = request.data.get('appointment_time')
            
            if not new_date_str and not new_time_str:
                return Response(
                    {'error': 'At least one of appointment_date or appointment_time is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            new_date = appointment.appointment_date
            new_time = appointment.appointment_time
            
            if new_date_str:
                try:
                    new_date = datetime.strptime(new_date_str, '%Y-%m-%d').date()
                except ValueError:
                    return Response(
                        {'error': 'Invalid date format. Use YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            if new_time_str:
                try:
                    new_time = datetime.strptime(new_time_str, '%H:%M').time()
                except ValueError:
                    return Response(
                        {'error': 'Invalid time format. Use HH:MM'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Validate new datetime is in the future
            new_datetime = datetime.combine(new_date, new_time)
            if new_datetime <= datetime.now():
                return Response(
                    {'error': 'New appointment date and time must be in the future'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check for conflicts — capacity-aware when availability is linked
            if appointment.availability:
                overlap_count = AppointmentRepository.count_overlapping_bookings(
                    availability=appointment.availability,
                    appointment_date=new_date,
                    start_time=new_time,
                    end_time=appointment.end_time or new_time,
                    exclude_appointment_id=appointment.id,
                )
                max_cap = appointment.availability.capacity or 1
                if overlap_count >= max_cap:
                    return Response(
                        {'error': 'This time slot is fully booked (capacity reached)'},
                        status=status.HTTP_409_CONFLICT
                    )
            else:
                conflict = Appointment.objects.filter(
                    business=appointment.business,
                    appointment_date=new_date,
                    appointment_time=new_time,
                    status='ACTIVE'
                ).exclude(id=appointment.id).exists()
                if conflict:
                    return Response(
                        {'error': 'This time slot is already booked'},
                        status=status.HTTP_409_CONFLICT
                    )
            
            # Update notes if provided
            notes = request.data.get('notes')
            if notes is not None:
                appointment.notes = notes
            
            appointment.appointment_date = new_date
            appointment.appointment_time = new_time
            appointment.save()
            
            serializer = self.get_serializer(appointment)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except (ValueError, TypeError) as e:
            return Response(
                {'error': f'Invalid data format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to reschedule appointment: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment based on user role.
        
        Customers can cancel their own appointments.
        Providers can cancel appointments for their businesses.
        
        Args:
            request: HTTP request object
            pk: Appointment ID
            
        Returns:
            Response: Cancelled appointment data or error message
        """
        try:
            appointment_id = int(pk)
            user = request.user
            
            if user.is_customer():
                # Customer cancellation
                try:
                    customer = Customer.objects.get(user=user)
                    cancelled_appointment = AppointmentService.cancel_appointment_by_customer(
                        appointment_id, customer
                    )
                except Customer.DoesNotExist:
                    return Response(
                        {'error': 'Customer profile not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                    
            elif user.is_provider():
                # Provider cancellation
                try:
                    provider = Provider.objects.get(user=user)
                    cancelled_appointment = AppointmentService.cancel_appointment_by_provider(
                        appointment_id, provider
                    )
                except Provider.DoesNotExist:
                    return Response(
                        {'error': 'Provider profile not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {'error': 'Invalid user role'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Serialize and return cancelled appointment
            serializer = self.get_serializer(cancelled_appointment)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid appointment ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except InvalidAppointmentDataError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except UnauthorizedAccessError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to cancel appointment: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Legacy views for backward compatibility (deprecated)
class AppointmentListView(viewsets.ReadOnlyModelViewSet):
    """
    Legacy API endpoint for listing customer appointments.
    
    DEPRECATED: Use AppointmentViewSet instead.
    Maintained for backward compatibility.
    """
    serializer_class = AppointmentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get appointments for the authenticated customer."""
        user = self.request.user
        if user.is_customer():
            try:
                customer = Customer.objects.get(user=user)
                return Appointment.objects.filter(customers=customer).order_by('appointment_date', 'appointment_time')
            except Customer.DoesNotExist:
                return Appointment.objects.none()
        return Appointment.objects.none()


class ProviderAppointmentListView(viewsets.ReadOnlyModelViewSet):
    """
    Legacy API endpoint for listing provider appointments.
    
    DEPRECATED: Use AppointmentViewSet instead.
    Maintained for backward compatibility.
    """
    serializer_class = AppointmentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get appointments for the authenticated provider."""
        user = self.request.user
        if user.is_provider():
            try:
                provider = Provider.objects.get(user=user)
                return Appointment.objects.filter(business__provider=provider).order_by('appointment_date', 'appointment_time')
            except Provider.DoesNotExist:
                return Appointment.objects.none()
        return Appointment.objects.none()


class AppointmentCancelView(viewsets.GenericViewSet):
    """
    Legacy API endpoint for cancelling appointments.
    
    DEPRECATED: Use AppointmentViewSet.cancel action instead.
    Maintained for backward compatibility.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an appointment."""
        # Redirect to new ViewSet implementation
        viewset = AppointmentViewSet()
        viewset.request = request
        return viewset.cancel(request, pk)