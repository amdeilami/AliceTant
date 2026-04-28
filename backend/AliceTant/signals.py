from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.db import connection

from AliceTant.models import SystemSetting
from AliceTant.repositories.system_setting_repository import SystemSettingRepository


@receiver(post_migrate)
def ensure_default_system_settings(sender, **kwargs):
    if sender.name != 'AliceTant':
        return

    if SystemSetting._meta.db_table not in connection.introspection.table_names():
        return

    defaults = [
        ('max_appointment_duration_minutes', 480, SystemSetting.ValueType.INT, 'Maximum appointment duration in minutes'),
        ('max_recurring_weeks', 64, SystemSetting.ValueType.INT, 'Maximum recurring availability duration in weeks'),
        ('max_bookings_per_customer_per_day', 10, SystemSetting.ValueType.INT, 'Maximum active bookings a customer can hold on one day'),
        ('announcement_banner_text', '', SystemSetting.ValueType.STRING, 'Announcement banner text'),
        ('announcement_banner_visible', False, SystemSetting.ValueType.BOOL, 'Whether the announcement banner is visible'),
        ('announcement_banner_severity', 'info', SystemSetting.ValueType.STRING, 'Announcement banner severity'),
    ]

    for key, value, value_type, description in defaults:
        if not SystemSetting.objects.filter(key=key).exists():
            SystemSettingRepository.set(
                key=key,
                value=value,
                value_type=value_type,
                description=description,
            )