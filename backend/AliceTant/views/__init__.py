"""
Views package for AliceTant API endpoints.

This package contains API views for authentication, user management,
and other application features.
"""

from .auth_views import SignupView, LoginView

__all__ = ['SignupView', 'LoginView']

def health_check(request):
    """Simple health check endpoint."""
    from django.http import JsonResponse
    return JsonResponse({'status': 'ok'})
