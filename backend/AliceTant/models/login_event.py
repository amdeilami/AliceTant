from django.db import models

from .user import User


class LoginEvent(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='login_events',
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alicetant_login_event'
        ordering = ['-created_at']

    def __str__(self):
        return f"LoginEvent(user={self.user_id}, success={self.success})"