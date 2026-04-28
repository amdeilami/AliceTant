from datetime import timedelta

from django.db.models import Count, Q
from django.db.models.functions import ExtractHour, ExtractWeekDay, TruncDate, TruncMonth, TruncWeek
from django.utils import timezone

from AliceTant.models import Appointment, AppointmentStatus, Business, PendingModification, User, UserRole
from AliceTant.exceptions.user_exceptions import UnauthorizedAccessError


class AdminAnalyticsService:
    @staticmethod
    def _window_start(days):
        days = max(int(days or 30), 1)
        return timezone.now().date() - timedelta(days=days - 1)

    @staticmethod
    def _resolve_granularity(days, granularity=None):
        if granularity in {'day', 'week', 'month'}:
            return granularity

        days = int(days or 30)
        if days <= 45:
            return 'day'
        if days <= 180:
            return 'week'
        return 'month'

    @staticmethod
    def _trunc_expression(field_name, granularity):
        if granularity == 'week':
            return TruncWeek(field_name)
        if granularity == 'month':
            return TruncMonth(field_name)
        return TruncDate(field_name)

    @staticmethod
    def _ensure_admin(user):
        if not user or user.role != UserRole.ADMIN:
            raise UnauthorizedAccessError('Admin access is required')

    @staticmethod
    def user_growth(admin_user, days=30, granularity=None):
        AdminAnalyticsService._ensure_admin(admin_user)
        window_start = AdminAnalyticsService._window_start(days)
        resolved_granularity = AdminAnalyticsService._resolve_granularity(days, granularity)
        totals = User.objects.values('role').annotate(count=Count('id')).order_by('role')
        growth = (
            User.objects
            .filter(created_at__date__gte=window_start)
            .annotate(period=AdminAnalyticsService._trunc_expression('created_at', resolved_granularity))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )
        return {
            'days': int(days),
            'granularity': resolved_granularity,
            'totals': list(totals),
            'growth': [{'period': item['period'], 'count': item['count']} for item in growth],
        }

    @staticmethod
    def booking_trends(admin_user, days=30, granularity=None):
        AdminAnalyticsService._ensure_admin(admin_user)
        window_start = AdminAnalyticsService._window_start(days)
        resolved_granularity = AdminAnalyticsService._resolve_granularity(days, granularity)
        queryset = Appointment.objects.filter(created_at__date__gte=window_start)
        daily = (
            queryset
            .annotate(period=AdminAnalyticsService._trunc_expression('created_at', resolved_granularity))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )
        peak_hours = queryset.annotate(hour=ExtractHour('appointment_time')).values('hour').annotate(count=Count('id')).order_by('-count', 'hour')
        peak_days = queryset.annotate(day=ExtractWeekDay('appointment_date')).values('day').annotate(count=Count('id')).order_by('-count', 'day')
        heatmap = (
            queryset
            .annotate(hour=ExtractHour('appointment_time'), day=ExtractWeekDay('appointment_date'))
            .values('hour', 'day')
            .annotate(count=Count('id'))
            .order_by('day', 'hour')
        )
        return {
            'days': int(days),
            'granularity': resolved_granularity,
            'total_bookings': queryset.count(),
            'daily': list(daily),
            'peak_hours': list(peak_hours),
            'peak_days': list(peak_days),
            'heatmap': list(heatmap),
        }

    @staticmethod
    def cancellation_metrics(admin_user, days=30):
        AdminAnalyticsService._ensure_admin(admin_user)
        window_start = AdminAnalyticsService._window_start(days)
        queryset = Appointment.objects.filter(created_at__date__gte=window_start)
        total = queryset.count() or 1
        cancelled = queryset.filter(status=AppointmentStatus.CANCELLED).count()
        pending_modifications = PendingModification.objects.filter(created_at__date__gte=window_start).count()
        return {
            'days': int(days),
            'total_appointments': total,
            'cancelled_appointments': cancelled,
            'cancellation_rate': cancelled / total,
            'modification_count': pending_modifications,
            'modification_rate': pending_modifications / total,
        }

    @staticmethod
    def business_popularity(admin_user, limit=10, days=30):
        AdminAnalyticsService._ensure_admin(admin_user)
        window_start = AdminAnalyticsService._window_start(days)
        ranked = Business.objects.annotate(
            booking_count=Count(
                'appointments',
                filter=Q(appointments__appointment_date__gte=window_start),
            )
        ).order_by('-booking_count', 'name')
        top = list(ranked[:limit].values('id', 'reference_id', 'name', 'booking_count'))
        bottom = list(ranked.order_by('booking_count', 'name')[:limit].values('id', 'reference_id', 'name', 'booking_count'))
        return {'days': int(days), 'top': top, 'bottom': bottom}