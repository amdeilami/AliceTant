from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from AliceTant.repositories.system_setting_repository import SystemSettingRepository


class AnnouncementView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(
            {
                'text': SystemSettingRepository.get('announcement_banner_text', ''),
                'visible': SystemSettingRepository.get('announcement_banner_visible', False),
                'severity': SystemSettingRepository.get('announcement_banner_severity', 'info'),
            },
            status=status.HTTP_200_OK,
        )