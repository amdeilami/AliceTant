from django.db import models

from .user import User


class SystemSetting(models.Model):
    class ValueType(models.TextChoices):
        STRING = 'string', 'String'
        INT = 'int', 'Integer'
        BOOL = 'bool', 'Boolean'
        JSON = 'json', 'JSON'

    key = models.CharField(max_length=128, unique=True)
    value = models.TextField(blank=True)
    value_type = models.CharField(max_length=12, choices=ValueType.choices, default=ValueType.STRING)
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_system_settings',
    )

    class Meta:
        db_table = 'alicetant_system_setting'
        ordering = ['key']

    def __str__(self):
        return self.key