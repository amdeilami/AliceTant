import json

from ..models import SystemSetting


class SystemSettingRepository:
    @staticmethod
    def _coerce_value(setting):
        if setting.value_type == SystemSetting.ValueType.INT:
            return int(setting.value)
        if setting.value_type == SystemSetting.ValueType.BOOL:
            return setting.value.lower() == 'true'
        if setting.value_type == SystemSetting.ValueType.JSON:
            return json.loads(setting.value or '{}')
        return setting.value

    @staticmethod
    def get(key, default=None):
        try:
            setting = SystemSetting.objects.get(key=key)
        except SystemSetting.DoesNotExist:
            return default
        return SystemSettingRepository._coerce_value(setting)

    @staticmethod
    def set(key, value, user=None, value_type=None, description=''):
        if value_type is None:
            if isinstance(value, bool):
                value_type = SystemSetting.ValueType.BOOL
            elif isinstance(value, int):
                value_type = SystemSetting.ValueType.INT
            elif isinstance(value, (dict, list)):
                value_type = SystemSetting.ValueType.JSON
            else:
                value_type = SystemSetting.ValueType.STRING

        stored_value = json.dumps(value) if value_type == SystemSetting.ValueType.JSON else str(value)

        setting, _ = SystemSetting.objects.update_or_create(
            key=key,
            defaults={
                'value': stored_value,
                'value_type': value_type,
                'description': description,
                'updated_by': user,
            },
        )
        return setting

    @staticmethod
    def all_settings():
        return SystemSetting.objects.select_related('updated_by').all().order_by('key')