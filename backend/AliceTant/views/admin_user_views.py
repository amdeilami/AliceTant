from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from AliceTant.exceptions.user_exceptions import InvalidUserDataError, UnauthorizedAccessError, UserNotFoundError
from AliceTant.permissions import IsAdmin
from AliceTant.serializers.admin_serializers import AdminUserSerializer, AuditLogSerializer, LoginEventSerializer
from AliceTant.services.admin_user_service import AdminUserService
from AliceTant.views.admin_helpers import paginate_queryset, parse_bool
from AliceTant.views.auth_views import JWTAuthentication


class AdminUserListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        filters = {
            'query': request.query_params.get('q', '').strip(),
            'role': request.query_params.get('role', '').strip(),
            'is_suspended': parse_bool(request.query_params.get('is_suspended')),
        }
        queryset = AdminUserService.list_users(request.user, filters)
        data = paginate_queryset(request, queryset, AdminUserSerializer)
        return Response(data, status=status.HTTP_200_OK)


class AdminUserSuspendView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        reason = request.data.get('reason', '').strip()
        try:
            user = AdminUserService.suspend_user(request.user, user_id, reason, request)
            return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)
        except (InvalidUserDataError, UnauthorizedAccessError) as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST if isinstance(exc, InvalidUserDataError) else status.HTTP_403_FORBIDDEN)
        except UserNotFoundError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_404_NOT_FOUND)


class AdminUserReactivateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        try:
            user = AdminUserService.reactivate_user(request.user, user_id, request)
            return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)
        except UnauthorizedAccessError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except UserNotFoundError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_404_NOT_FOUND)


class AdminUserForcePasswordResetView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        try:
            user = AdminUserService.force_password_reset(request.user, user_id, request)
            return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)
        except UnauthorizedAccessError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except UserNotFoundError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_404_NOT_FOUND)


class AdminUserLoginHistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, user_id):
        queryset = AdminUserService.get_login_history(request.user, user_id)
        data = paginate_queryset(request, queryset, LoginEventSerializer)
        return Response(data, status=status.HTTP_200_OK)


class AdminAuditLogView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        filters = {
            'actor_id': request.query_params.get('actor_id'),
            'action': request.query_params.get('action', '').strip(),
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
        }
        queryset = AdminUserService.get_audit_logs(request.user, filters)
        data = paginate_queryset(request, queryset, AuditLogSerializer)
        return Response(data, status=status.HTTP_200_OK)