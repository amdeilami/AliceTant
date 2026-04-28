from AliceTant.models import UserRole
from AliceTant.repositories.audit_log_repository import AuditLogRepository
from AliceTant.repositories.user_repository import UserRepository
from AliceTant.exceptions.user_exceptions import UnauthorizedAccessError, InvalidUserDataError
from AliceTant.models import AuditLog


class AdminUserService:
    @staticmethod
    def _ensure_admin(user):
        if not user or user.role != UserRole.ADMIN:
            raise UnauthorizedAccessError('Admin access is required')

    @staticmethod
    def list_users(admin_user, filters=None):
        AdminUserService._ensure_admin(admin_user)
        return UserRepository.list_all_users(filters)

    @staticmethod
    def suspend_user(admin_user, target_user_id, reason='', request=None):
        AdminUserService._ensure_admin(admin_user)
        if admin_user.id == target_user_id:
            raise InvalidUserDataError('Admins cannot suspend themselves')
        user = UserRepository.suspend_user(target_user_id, reason)
        AuditLogRepository.log_action(admin_user, 'SUSPEND_USER', AuditLog.TargetType.USER, user.id, {'reason': reason}, request)
        return user

    @staticmethod
    def reactivate_user(admin_user, target_user_id, request=None):
        AdminUserService._ensure_admin(admin_user)
        user = UserRepository.reactivate_user(target_user_id)
        AuditLogRepository.log_action(admin_user, 'REACTIVATE_USER', AuditLog.TargetType.USER, user.id, {}, request)
        return user

    @staticmethod
    def force_password_reset(admin_user, target_user_id, request=None):
        AdminUserService._ensure_admin(admin_user)
        user = UserRepository.force_password_reset(target_user_id)
        AuditLogRepository.log_action(admin_user, 'FORCE_PASSWORD_RESET', AuditLog.TargetType.USER, user.id, {}, request)
        return user

    @staticmethod
    def get_login_history(admin_user, user_id):
        AdminUserService._ensure_admin(admin_user)
        return AuditLogRepository.get_login_history(user_id)

    @staticmethod
    def get_audit_logs(admin_user, filters=None):
        AdminUserService._ensure_admin(admin_user)
        return AuditLogRepository.list_logs(filters)