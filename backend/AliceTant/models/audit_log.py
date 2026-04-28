from django.db import models

from .user import User


class AuditLog(models.Model):
    class TargetType(models.TextChoices):
        USER = 'USER', 'User'
        BUSINESS = 'BUSINESS', 'Business'
        APPOINTMENT = 'APPOINTMENT', 'Appointment'
        SYSTEM = 'SYSTEM', 'System'
        BACKUP = 'BACKUP', 'Backup'
        SETTING = 'SETTING', 'Setting'

    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=64)
    target_type = models.CharField(max_length=16, choices=TargetType.choices)
    target_id = models.PositiveIntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alicetant_audit_log'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} ({self.target_type}:{self.target_id})"