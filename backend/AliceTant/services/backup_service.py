import csv
import shutil
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.db import connections
from django.http import HttpResponse

from AliceTant.models import Appointment, Business, User


class BackupService:
    @staticmethod
    def backup_dir():
        path = Path(settings.BASE_DIR) / 'backups'
        path.mkdir(parents=True, exist_ok=True)
        return path

    @staticmethod
    def create_backup():
        source = Path(settings.BASE_DIR) / 'db.sqlite3'
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        destination = BackupService.backup_dir() / f'alicetant-{timestamp}.sqlite3'
        shutil.copy2(source, destination)
        return BackupService._metadata(destination)

    @staticmethod
    def list_backups():
        return [BackupService._metadata(path) for path in sorted(BackupService.backup_dir().glob('*.sqlite3'), reverse=True)]

    @staticmethod
    def restore_backup(filename):
        backup_path = BackupService.backup_dir() / Path(filename).name
        if not backup_path.exists():
            raise FileNotFoundError('Backup not found')
        connections.close_all()
        destination = Path(settings.BASE_DIR) / 'db.sqlite3'
        shutil.copy2(backup_path, destination)
        return BackupService._metadata(backup_path)

    @staticmethod
    def delete_backup(filename):
        backup_path = BackupService.backup_dir() / Path(filename).name
        if not backup_path.exists():
            raise FileNotFoundError('Backup not found')
        backup_path.unlink()
        return True

    @staticmethod
    def write_uploaded_backup(file_obj):
        destination = BackupService.backup_dir() / Path(file_obj.name).name
        with destination.open('wb+') as handle:
            for chunk in file_obj.chunks():
                handle.write(chunk)
        return BackupService.restore_backup(destination.name)

    @staticmethod
    def export_users_csv():
        rows = User.objects.all().order_by('id')
        return BackupService._csv_response('users.csv', ['id', 'reference_id', 'username', 'email', 'role', 'is_suspended'], rows, lambda item: [item.id, item.reference_id, item.username, item.email, item.role, item.is_suspended])

    @staticmethod
    def export_businesses_csv():
        rows = Business.objects.select_related('provider__user').all().order_by('id')
        return BackupService._csv_response('businesses.csv', ['id', 'reference_id', 'name', 'provider_email', 'email', 'phone', 'is_hidden'], rows, lambda item: [item.id, item.reference_id, item.name, item.provider.user.email, item.email, item.phone, item.is_hidden])

    @staticmethod
    def export_appointments_csv():
        rows = Appointment.objects.select_related('business').prefetch_related('customers__user').all().order_by('id')
        return BackupService._csv_response('appointments.csv', ['id', 'reference_id', 'business_name', 'customer_emails', 'appointment_date', 'appointment_time', 'status'], rows, lambda item: [item.id, item.reference_id, item.business.name, ', '.join(customer.user.email for customer in item.customers.all()), item.appointment_date, item.appointment_time, item.status])

    @staticmethod
    def _metadata(path):
        stat = path.stat()
        return {'filename': path.name, 'size': stat.st_size, 'created_at': datetime.utcfromtimestamp(stat.st_ctime).isoformat()}

    @staticmethod
    def _csv_response(filename, headers, rows, row_builder):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        writer = csv.writer(response)
        writer.writerow(headers)
        for row in rows:
            writer.writerow(row_builder(row))
        return response