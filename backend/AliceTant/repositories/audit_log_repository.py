from ..models import AuditLog, LoginEvent


class AuditLogRepository:
    @staticmethod
    def log_action(actor=None, action='', target_type=AuditLog.TargetType.SYSTEM, target_id=None, details=None, request=None):
        details = details or {}
        ip_address = None
        user_agent = ''
        if request is not None:
            ip_address = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')

        return AuditLog.objects.create(
            actor=actor,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @staticmethod
    def list_logs(filters=None):
        filters = filters or {}
        queryset = AuditLog.objects.select_related('actor').all().order_by('-created_at')

        actor_id = filters.get('actor_id')
        if actor_id:
            queryset = queryset.filter(actor_id=actor_id)

        action = filters.get('action')
        if action:
            queryset = queryset.filter(action__icontains=action)

        start_date = filters.get('start_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)

        end_date = filters.get('end_date')
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        return queryset

    @staticmethod
    def log_login_event(user=None, success=False, request=None):
        ip_address = None
        user_agent = ''
        if request is not None:
            ip_address = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')

        return LoginEvent.objects.create(
            user=user,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @staticmethod
    def get_login_history(user_id):
        return LoginEvent.objects.filter(user_id=user_id).order_by('-created_at')