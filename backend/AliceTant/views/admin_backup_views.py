from pathlib import Path

from django.http import FileResponse
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from AliceTant.models import AuditLog
from AliceTant.permissions import IsAdmin
from AliceTant.repositories.audit_log_repository import AuditLogRepository
from AliceTant.services.backup_service import BackupService
from AliceTant.views.auth_views import JWTAuthentication


class AdminBackupListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({'results': BackupService.list_backups()}, status=status.HTTP_200_OK)

    def post(self, request):
        backup = BackupService.create_backup()
        AuditLogRepository.log_action(request.user, 'CREATE_BACKUP', AuditLog.TargetType.BACKUP, details=backup, request=request)
        return Response(backup, status=status.HTTP_201_CREATED)


class AdminBackupDownloadView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, filename):
        file_path = BackupService.backup_dir() / Path(filename).name
        if not file_path.exists():
            return Response({'error': 'Backup not found'}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(file_path.open('rb'), as_attachment=True, filename=file_path.name)


class AdminBackupRestoreView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        if 'file' in request.FILES:
            restored = BackupService.write_uploaded_backup(request.FILES['file'])
        else:
            filename = request.data.get('filename', '')
            restored = BackupService.restore_backup(filename)
        AuditLogRepository.log_action(request.user, 'RESTORE_BACKUP', AuditLog.TargetType.BACKUP, details=restored, request=request)
        return Response({'message': 'Backup restored successfully.', 'backup': restored}, status=status.HTTP_200_OK)


class AdminBackupDeleteView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, filename):
        BackupService.delete_backup(filename)
        AuditLogRepository.log_action(request.user, 'DELETE_BACKUP', AuditLog.TargetType.BACKUP, details={'filename': filename}, request=request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminExportUsersView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return BackupService.export_users_csv()


class AdminExportBusinessesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return BackupService.export_businesses_csv()


class AdminExportAppointmentsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return BackupService.export_appointments_csv()