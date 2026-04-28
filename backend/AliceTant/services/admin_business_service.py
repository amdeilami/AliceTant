from AliceTant.models import AuditLog, UserRole
from AliceTant.repositories.audit_log_repository import AuditLogRepository
from AliceTant.repositories.business_repository import BusinessRepository
from AliceTant.exceptions.user_exceptions import UnauthorizedAccessError


class AdminBusinessService:
    @staticmethod
    def _ensure_admin(user):
        if not user or user.role != UserRole.ADMIN:
            raise UnauthorizedAccessError('Admin access is required')

    @staticmethod
    def list_businesses(admin_user, query='', is_hidden=None):
        AdminBusinessService._ensure_admin(admin_user)
        return BusinessRepository.list_admin_businesses(query=query, is_hidden=is_hidden)

    @staticmethod
    def hide_business(admin_user, business_id, reason='', request=None):
        AdminBusinessService._ensure_admin(admin_user)
        business = BusinessRepository.hide_business(business_id, reason)
        AuditLogRepository.log_action(admin_user, 'HIDE_BUSINESS', AuditLog.TargetType.BUSINESS, business.id, {'reason': reason}, request)
        return business

    @staticmethod
    def unhide_business(admin_user, business_id, request=None):
        AdminBusinessService._ensure_admin(admin_user)
        business = BusinessRepository.unhide_business(business_id)
        AuditLogRepository.log_action(admin_user, 'UNHIDE_BUSINESS', AuditLog.TargetType.BUSINESS, business.id, {}, request)
        return business