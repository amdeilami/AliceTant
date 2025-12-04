"""
Appointment views for AliceTant application.

This module provides API endpoints for managing appointments.
Currently returns mock data until the Appointment model is implemented.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated


class AppointmentListView(APIView):
    """
    API endpoint for listing customer appointments.
    
    GET /api/appointments/
    Returns a list of appointments for the authenticated customer.
    
    Currently returns mock data for development purposes.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Retrieve appointments for the authenticated customer.
        
        Args:
            request: HTTP request object with authenticated user
            
        Returns:
            Response: JSON array of appointment objects
        """
        # Mock data for development
        # TODO: Replace with actual database queries when Appointment model is implemented
        mock_appointments = [
            {
                'id': '1',
                'date': '2025-12-10',
                'time': '10:00',
                'providerName': 'John Smith',
                'businessName': 'Smith Hair Salon',
                'status': 'upcoming'
            },
            {
                'id': '2',
                'date': '2025-11-15',
                'time': '14:30',
                'providerName': 'Jane Doe',
                'businessName': 'Doe Tutoring',
                'status': 'completed'
            },
            {
                'id': '3',
                'date': '2025-12-05',
                'time': '09:00',
                'providerName': 'Bob Johnson',
                'businessName': 'Johnson Art Studio',
                'status': 'upcoming'
            },
        ]
        
        return Response(mock_appointments, status=status.HTTP_200_OK)


class ProviderAppointmentListView(APIView):
    """
    API endpoint for listing provider appointments.
    
    GET /api/appointments/provider/
    Returns a list of appointments across all provider's businesses.
    
    Currently returns mock data for development purposes.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Retrieve appointments for the authenticated provider across all their businesses.
        
        Args:
            request: HTTP request object with authenticated user
            
        Returns:
            Response: JSON array of appointment objects with customer details
        """
        # Verify user is a provider
        if request.user.role.lower() != 'provider':
            return Response(
                {'error': 'Only providers can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mock data for development
        # TODO: Replace with actual database queries when Appointment model is implemented
        mock_appointments = [
            {
                'id': '1',
                'customerName': 'Alice Johnson',
                'customerEmail': 'alice@example.com',
                'businessName': 'Smith Hair Salon',
                'date': '2025-12-10',
                'time': '10:00',
                'status': 'confirmed'
            },
            {
                'id': '2',
                'customerName': 'Bob Williams',
                'customerEmail': 'bob@example.com',
                'businessName': 'Smith Hair Salon',
                'date': '2025-12-15',
                'time': '14:30',
                'status': 'confirmed'
            },
            {
                'id': '3',
                'customerName': 'Carol Davis',
                'customerEmail': 'carol@example.com',
                'businessName': 'Smith Tutoring',
                'date': '2025-12-05',
                'time': '09:00',
                'status': 'confirmed'
            },
            {
                'id': '4',
                'customerName': 'David Brown',
                'customerEmail': 'david@example.com',
                'businessName': 'Smith Hair Salon',
                'date': '2025-11-20',
                'time': '11:00',
                'status': 'completed'
            },
        ]
        
        return Response(mock_appointments, status=status.HTTP_200_OK)


class AppointmentCancelView(APIView):
    """
    API endpoint for cancelling appointments.
    
    POST /api/appointments/<appointment_id>/cancel/
    Cancels an appointment and updates its status.
    
    Currently returns mock response until the Appointment model is implemented.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, appointment_id):
        """
        Cancel an appointment.
        
        Args:
            request: HTTP request object with authenticated user
            appointment_id: ID of the appointment to cancel
            
        Returns:
            Response: JSON object with success message and updated appointment
        """
        # Mock response for development
        # TODO: Replace with actual database operations when Appointment model is implemented
        
        # Simulate successful cancellation
        cancelled_appointment = {
            'id': str(appointment_id),
            'status': 'cancelled',
            'message': 'Appointment cancelled successfully'
        }
        
        return Response(cancelled_appointment, status=status.HTTP_200_OK)
