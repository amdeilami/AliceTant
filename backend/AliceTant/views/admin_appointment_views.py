from datetime import datetime

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from AliceTant.exceptions.user_exceptions import InvalidAppointmentDataError, UnauthorizedAccessError
from AliceTant.permissions import IsAdmin
from AliceTant.serializers.admin_serializers import AdminAppointmentSerializer
from AliceTant.services.admin_appointment_service import AdminAppointmentService
from AliceTant.views.admin_helpers import paginate_queryset
from AliceTant.views.auth_views import JWTAuthentication


class AdminAppointmentListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        filters = {
            'query': request.query_params.get('q', '').strip(),
            'status': request.query_params.get('status', '').strip(),
            'business_id': request.query_params.get('business_id'),
            'customer_id': request.query_params.get('customer_id'),
        }

        try:
            start_date = request.query_params.get('start_date')
            if start_date:
                filters['start_date'] = datetime.strptime(start_date, '%Y-%m-%d').date()

            end_date = request.query_params.get('end_date')
            if end_date:
                filters['end_date'] = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Dates must use YYYY-MM-DD format'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = AdminAppointmentService.list_appointments(request.user, filters)
        data = paginate_queryset(request, queryset, AdminAppointmentSerializer)
        return Response(data, status=status.HTTP_200_OK)


class AdminAppointmentForceCancelView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, appointment_id):
        try:
            appointment = AdminAppointmentService.force_cancel(appointment_id, request.user, request.data.get('reason', '').strip(), request)
            return Response(AdminAppointmentSerializer(appointment).data, status=status.HTTP_200_OK)
        except UnauthorizedAccessError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except InvalidAppointmentDataError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)