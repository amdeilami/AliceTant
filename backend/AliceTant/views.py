"""
Views for the AliceTant application.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint to verify the API is running.

    Args:
        request: HTTP request object.

    Returns:
        Response: JSON response with status message.
    """
    return Response({'status': 'ok', 'message': 'AliceTant API is running'})
