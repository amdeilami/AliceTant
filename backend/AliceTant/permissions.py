from rest_framework.permissions import BasePermission

from .models.user import UserRole


class IsAdmin(BasePermission):
    message = 'Admin access is required.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and user.role == UserRole.ADMIN)