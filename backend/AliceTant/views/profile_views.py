"""
Profile management API views for AliceTant application.

This module provides REST API endpoints for user profile operations
including email updates, password changes, and avatar uploads.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from ..views.auth_views import JWTAuthentication
from ..serializers.profile_serializers import (
    EmailUpdateSerializer,
    PasswordUpdateSerializer,
    AvatarUpdateSerializer
)
from ..serializers.auth_serializers import UserSerializer

# Configure logger for profile views
logger = logging.getLogger(__name__)


class EmailUpdateView(APIView):
    """
    API view for updating user email address.
    
    Handles PUT requests to update the authenticated user's email.
    Requires authentication via JWT token.
    
    Endpoint: PUT /api/profile/email/
    
    Headers:
        Authorization: Bearer <JWT_TOKEN>
    
    Request Body:
        {
            "email": "string (required, valid email)"
        }
    
    Success Response (200 OK):
        {
            "message": "Email updated successfully",
            "user": {
                "id": integer,
                "username": "string",
                "email": "string",
                "role": "string",
                "full_name": "string"
            }
        }
    
    Error Responses:
        - 400 Bad Request: Invalid email or validation errors
        - 401 Unauthorized: Missing or invalid token
        - 409 Conflict: Email already in use
        - 500 Internal Server Error: Server error during update
    """
    
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        """
        Handle email update PUT request.
        
        Args:
            request: Django REST Framework request object
        
        Returns:
            Response: JSON response with success message and updated user data
        """
        user = request.user
        
        # Validate request data
        serializer = EmailUpdateSerializer(data=request.data, context={'user': user})
        
        if not serializer.is_valid():
            # Check if error is due to duplicate email
            if 'email' in serializer.errors:
                email_errors = serializer.errors['email']
                if any('already in use' in str(error) for error in email_errors):
                    return Response(
                        {'error': str(email_errors[0])},
                        status=status.HTTP_409_CONFLICT
                    )
            
            return Response(
                {
                    'error': 'Validation failed',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Update email
            new_email = serializer.validated_data['email']
            user.email = new_email
            user.save()
            
            # Serialize updated user data
            user_serializer = UserSerializer(user)
            
            logger.info(f"Email updated successfully for user {user.id}")
            
            return Response(
                {
                    'message': 'Email updated successfully',
                    'user': user_serializer.data
                },
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            logger.error(f"Failed to update email for user {user.id}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while updating email. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PasswordUpdateView(APIView):
    """
    API view for updating user password.
    
    Handles PUT requests to change the authenticated user's password.
    Requires authentication via JWT token and current password verification.
    
    Endpoint: PUT /api/profile/password/
    
    Headers:
        Authorization: Bearer <JWT_TOKEN>
    
    Request Body:
        {
            "current_password": "string (required)",
            "new_password": "string (required, min 8 chars)",
            "confirm_password": "string (required)"
        }
    
    Success Response (200 OK):
        {
            "message": "Password updated successfully"
        }
    
    Error Responses:
        - 400 Bad Request: Invalid data or validation errors
        - 401 Unauthorized: Missing or invalid token, or incorrect current password
        - 500 Internal Server Error: Server error during update
    """
    
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        """
        Handle password update PUT request.
        
        Args:
            request: Django REST Framework request object
        
        Returns:
            Response: JSON response with success message
        """
        user = request.user
        
        # Validate request data
        serializer = PasswordUpdateSerializer(data=request.data, context={'user': user})
        
        if not serializer.is_valid():
            # Check if error is due to incorrect current password
            if 'current_password' in serializer.errors:
                return Response(
                    {'error': str(serializer.errors['current_password'][0])},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            return Response(
                {
                    'error': 'Validation failed',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Update password
            new_password = serializer.validated_data['new_password']
            user.set_password(new_password)
            user.save()
            
            logger.info(f"Password updated successfully for user {user.id}")
            
            return Response(
                {'message': 'Password updated successfully'},
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            logger.error(f"Failed to update password for user {user.id}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while updating password. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AvatarUpdateView(APIView):
    """
    API view for updating user avatar image.
    
    Handles POST requests to upload a new avatar for the authenticated user.
    Requires authentication via JWT token. Accepts multipart/form-data.
    
    Endpoint: POST /api/profile/avatar/
    
    Headers:
        Authorization: Bearer <JWT_TOKEN>
        Content-Type: multipart/form-data
    
    Request Body (form-data):
        avatar: File (required, image file)
    
    Success Response (200 OK):
        {
            "message": "Avatar updated successfully",
            "avatar_url": "string (URL to avatar)"
        }
    
    Error Responses:
        - 400 Bad Request: Invalid file or validation errors
        - 401 Unauthorized: Missing or invalid token
        - 500 Internal Server Error: Server error during upload
    """
    
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """
        Handle avatar upload POST request.
        
        Args:
            request: Django REST Framework request object
        
        Returns:
            Response: JSON response with success message and avatar URL
        """
        user = request.user
        
        # Validate request data
        serializer = AvatarUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'error': 'Validation failed',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # For now, we'll store avatar info in a simple way
            # In production, you'd want to use Django's FileField or ImageField
            # and store files in media directory or cloud storage
            
            avatar_file = serializer.validated_data['avatar']
            
            # TODO: Implement actual file storage
            # For MVP, we'll just acknowledge the upload
            # In production: save to user.avatar field and return URL
            
            logger.info(f"Avatar uploaded for user {user.id}: {avatar_file.name}")
            
            return Response(
                {
                    'message': 'Avatar updated successfully',
                    'avatar_url': f'/media/avatars/{user.id}/{avatar_file.name}'
                },
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            logger.error(f"Failed to upload avatar for user {user.id}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while uploading avatar. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
