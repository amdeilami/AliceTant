from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from AliceTant.exceptions.user_exceptions import BusinessNotFoundError, UnauthorizedAccessError
from AliceTant.permissions import IsAdmin
from AliceTant.serializers.admin_serializers import AdminBusinessSerializer
from AliceTant.services.admin_business_service import AdminBusinessService
from AliceTant.views.admin_helpers import paginate_queryset, parse_bool
from AliceTant.views.auth_views import JWTAuthentication


class AdminBusinessListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        queryset = AdminBusinessService.list_businesses(
            request.user,
            query=request.query_params.get('q', '').strip(),
            is_hidden=parse_bool(request.query_params.get('is_hidden')),
        )
        data = paginate_queryset(request, queryset, AdminBusinessSerializer)
        return Response(data, status=status.HTTP_200_OK)


class AdminBusinessHideView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, business_id):
        try:
            business = AdminBusinessService.hide_business(request.user, business_id, request.data.get('reason', '').strip(), request)
            return Response(AdminBusinessSerializer(business).data, status=status.HTTP_200_OK)
        except UnauthorizedAccessError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except BusinessNotFoundError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_404_NOT_FOUND)


class AdminBusinessUnhideView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, business_id):
        try:
            business = AdminBusinessService.unhide_business(request.user, business_id, request)
            return Response(AdminBusinessSerializer(business).data, status=status.HTTP_200_OK)
        except UnauthorizedAccessError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except BusinessNotFoundError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_404_NOT_FOUND)