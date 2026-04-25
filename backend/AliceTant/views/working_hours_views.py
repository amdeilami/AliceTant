from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from AliceTant.models import Business, Provider, WorkingHours, BusinessClosure
from AliceTant.serializers.working_hours_serializers import (
    WorkingHoursSerializer, BusinessClosureSerializer
)
from AliceTant.views.auth_views import JWTAuthentication


def _get_provider_business(user, business_id):
    """Helper: return the Business if the user is its provider, else None."""
    try:
        provider = Provider.objects.get(user=user)
        return Business.objects.get(id=business_id, provider=provider)
    except (Provider.DoesNotExist, Business.DoesNotExist):
        return None


class WorkingHoursListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business_id = request.query_params.get('business_id')
        if not business_id:
            return Response({'error': 'business_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        hours = WorkingHours.objects.filter(business_id=business_id)
        serializer = WorkingHoursSerializer(hours, many=True)
        return Response(serializer.data)

    def post(self, request):
        business_id = request.data.get('business')
        if not business_id:
            return Response({'error': 'business is required'}, status=status.HTTP_400_BAD_REQUEST)

        business = _get_provider_business(request.user, business_id)
        if not business:
            return Response({'error': 'Business not found or not owned by you'}, status=status.HTTP_404_NOT_FOUND)

        serializer = WorkingHoursSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        """Bulk set working hours for a business (replace all)."""
        business_id = request.data.get('business_id')
        hours_data = request.data.get('hours', [])

        if not business_id:
            return Response({'error': 'business_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        business = _get_provider_business(request.user, business_id)
        if not business:
            return Response({'error': 'Business not found or not owned by you'}, status=status.HTTP_404_NOT_FOUND)

        # Delete existing and recreate
        WorkingHours.objects.filter(business=business).delete()

        created = []
        for entry in hours_data:
            entry['business'] = business.id
            serializer = WorkingHoursSerializer(data=entry)
            if serializer.is_valid():
                serializer.save()
                created.append(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(created, status=status.HTTP_200_OK)


class WorkingHoursDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            wh = WorkingHours.objects.get(id=pk)
        except WorkingHours.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        business = _get_provider_business(request.user, wh.business_id)
        if not business:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        wh.delete()
        return Response({'message': 'Deleted'}, status=status.HTTP_204_NO_CONTENT)


class BusinessClosureListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business_id = request.query_params.get('business_id')
        if not business_id:
            return Response({'error': 'business_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        closures = BusinessClosure.objects.filter(business_id=business_id)
        serializer = BusinessClosureSerializer(closures, many=True)
        return Response(serializer.data)

    def post(self, request):
        business_id = request.data.get('business')
        if not business_id:
            return Response({'error': 'business is required'}, status=status.HTTP_400_BAD_REQUEST)

        business = _get_provider_business(request.user, business_id)
        if not business:
            return Response({'error': 'Business not found or not owned by you'}, status=status.HTTP_404_NOT_FOUND)

        serializer = BusinessClosureSerializer(data=request.data)
        if serializer.is_valid():
            closure = serializer.save()
            # The model's save() already cancels overlapping appointments
            # Return how many were cancelled for UI feedback
            from AliceTant.models import Appointment, AppointmentStatus
            cancelled_count = Appointment.objects.filter(
                business=business,
                status=AppointmentStatus.CANCELLED,
                appointment_date__gte=closure.start_date,
                appointment_date__lte=closure.end_date,
            ).count()
            data = serializer.data
            data['cancelled_appointments'] = cancelled_count
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BusinessClosureDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            closure = BusinessClosure.objects.get(id=pk)
        except BusinessClosure.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        business = _get_provider_business(request.user, closure.business_id)
        if not business:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        closure.delete()
        return Response({'message': 'Deleted'}, status=status.HTTP_204_NO_CONTENT)
