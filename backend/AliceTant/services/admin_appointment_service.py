from AliceTant.models import AuditLog, UserRole
from AliceTant.repositories.appointment_repository import AppointmentRepository
from AliceTant.repositories.audit_log_repository import AuditLogRepository
from AliceTant.exceptions.user_exceptions import UnauthorizedAccessError


class AdminAppointmentService:
    @staticmethod
    def _ensure_admin(user):
        if not user or user.role != UserRole.ADMIN:
            raise UnauthorizedAccessError('Admin access is required')

    @staticmethod
    def list_appointments(admin_user, filters=None):
        AdminAppointmentService._ensure_admin(admin_user)
        return AppointmentRepository.list_all_for_admin(filters)

    @staticmethod
    def force_cancel(appointment_id, admin_user, reason='', request=None):
        AdminAppointmentService._ensure_admin(admin_user)
        appointment = AppointmentRepository.cancel_appointment(appointment_id)
        AuditLogRepository.log_action(
            admin_user,
            'FORCE_CANCEL_APPOINTMENT',
            AuditLog.TargetType.APPOINTMENT,
            appointment.id,
            {'reason': reason},
            request,
        )
        return appointment