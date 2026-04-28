import json

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from AliceTant.models import AuditLog, SystemSetting
from AliceTant.permissions import IsAdmin
from AliceTant.repositories.audit_log_repository import AuditLogRepository
from AliceTant.repositories.system_setting_repository import SystemSettingRepository
from AliceTant.serializers.admin_serializers import SystemSettingSerializer
from AliceTant.views.auth_views import JWTAuthentication


class AdminSettingListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        serializer = SystemSettingSerializer(SystemSettingRepository.all_settings(), many=True)
        return Response({'results': serializer.data}, status=status.HTTP_200_OK)


class AdminSettingDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, key):
        try:
            existing = SystemSetting.objects.get(key=key)
        except SystemSetting.DoesNotExist:
            return Response({'error': 'Setting not found'}, status=status.HTTP_404_NOT_FOUND)

        value = request.data.get('value')
        if existing.value_type == SystemSetting.ValueType.JSON and isinstance(value, str):
            value = json.loads(value)
        setting = SystemSettingRepository.set(key, value, user=request.user, value_type=existing.value_type, description=existing.description)
        AuditLogRepository.log_action(request.user, 'UPDATE_SETTING', AuditLog.TargetType.SETTING, details={'key': key, 'value': value}, request=request)
        return Response(SystemSettingSerializer(setting).data, status=status.HTTP_200_OK)