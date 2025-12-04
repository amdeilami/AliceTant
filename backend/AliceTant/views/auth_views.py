"""
Authentication API views for AliceTant application.

This module provides REST API endpoints for user authentication operations
including signup (registration) and login. Views handle HTTP requests,
validate data using serializers, coordinate with service layer, and return
appropriate JSON responses with proper status codes.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..serializers.auth_serializers import SignupSerializer, LoginSerializer, UserSerializer
from ..services.auth_service import AuthService
from ..exceptions.user_exceptions import (
    DuplicateUserError,
    InvalidUserDataError
)

# Configure logger for authentication views
logger = logging.getLogger(__name__)


class SignupView(APIView):
    """
    API view for user registration (signup).
    
    Handles POST requests to create new user accounts with role-specific
    profiles (Customer or Provider). Validates input data, creates user
    and profile in a transaction, and returns user data on success.
    
    Endpoint: POST /api/auth/signup/
    
    Request Body:
        {
            "full_name": "string (required, 2-64 chars)",
            "email": "string (required, valid email)",
            "phone_number": "string (optional)",
            "password": "string (required, min 8 chars)",
            "role": "string (required, 'customer' or 'provider')"
        }
    
    Success Response (201 Created):
        {
            "id": integer,
            "username": "string",
            "email": "string",
            "role": "string",
            "full_name": "string",
            "created_at": "datetime"
        }
    
    Error Responses:
        - 400 Bad Request: Invalid data or validation errors
        - 409 Conflict: Duplicate email or username
        - 500 Internal Server Error: Server error during registration
    """
    
    def post(self, request):
        """
        Handle user registration POST request.
        
        Validates signup data, creates user with role-specific profile,
        and returns user data with 201 status on success. Handles various
        error scenarios with appropriate status codes and error messages.
        
        Args:
            request: Django REST Framework request object containing signup data
        
        Returns:
            Response: JSON response with user data or error message
        """
        # Validate request data using SignupSerializer
        serializer = SignupSerializer(data=request.data)
        
        if not serializer.is_valid():
            # Check if error is due to duplicate email (return 409)
            if 'email' in serializer.errors:
                email_errors = serializer.errors['email']
                if any('already exists' in str(error) for error in email_errors):
                    return Response(
                        {'error': str(email_errors[0])},
                        status=status.HTTP_409_CONFLICT
                    )
            
            # Return 400 with validation errors for other cases
            return Response(
                {
                    'error': 'Validation failed',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract validated data
        validated_data = serializer.validated_data
        full_name = validated_data['full_name']
        email = validated_data['email']
        password = validated_data['password']
        role = validated_data['role']
        phone_number = validated_data.get('phone_number', None)
        
        try:
            # Register user via AuthService
            user = AuthService.register_user(
                full_name=full_name,
                email=email,
                password=password,
                role=role,
                phone_number=phone_number
            )
            
            # Serialize user data for response (excludes password)
            user_serializer = UserSerializer(user)
            
            # Return 201 Created with user data
            return Response(
                user_serializer.data,
                status=status.HTTP_201_CREATED
            )
        
        except DuplicateUserError as e:
            # Handle duplicate email/username - return 409 Conflict
            logger.warning(
                f"Signup failed - duplicate user: {str(e)} (email: {email})"
            )
            return Response(
                {'error': str(e)},
                status=status.HTTP_409_CONFLICT
            )
        
        except InvalidUserDataError as e:
            # Handle validation errors from service layer - return 400
            logger.warning(
                f"Signup failed - invalid data: {str(e)} (email: {email})"
            )
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            # Handle unexpected errors - return 500
            logger.error(
                f"Signup failed - unexpected error: {str(e)} (email: {email})",
                exc_info=True
            )
            return Response(
                {'error': 'An error occurred during registration. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    """
    API view for user authentication (login).
    
    Handles POST requests to authenticate users with email and password.
    Validates credentials, generates JWT token on success, and returns
    token with user data.
    
    Endpoint: POST /api/auth/login/
    
    Request Body:
        {
            "email": "string (required)",
            "password": "string (required)"
        }
    
    Success Response (200 OK):
        {
            "token": "string (JWT)",
            "user": {
                "id": integer,
                "username": "string",
                "email": "string",
                "role": "string",
                "full_name": "string"
            }
        }
    
    Error Responses:
        - 400 Bad Request: Missing fields or validation errors
        - 401 Unauthorized: Invalid credentials
        - 500 Internal Server Error: Server error during authentication
    """
    
    def post(self, request):
        """
        Handle user login POST request.
        
        Validates login credentials, authenticates user, generates JWT token,
        and returns token with user data on success. Handles various error
        scenarios with appropriate status codes and error messages.
        
        Args:
            request: Django REST Framework request object containing login credentials
        
        Returns:
            Response: JSON response with token and user data or error message
        """
        # Validate request data using LoginSerializer
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            # Return 400 with validation errors
            return Response(
                {
                    'error': 'Validation failed',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract validated data
        validated_data = serializer.validated_data
        email = validated_data['email']
        password = validated_data['password']
        
        try:
            # Authenticate user via AuthService
            user = AuthService.authenticate_user(email=email, password=password)
            
            if user is None:
                # Invalid credentials - return 401 Unauthorized
                logger.warning(
                    f"Login failed - invalid credentials (email: {email})"
                )
                return Response(
                    {'error': 'Invalid email or password'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Generate JWT token for authenticated user
            token = AuthService.generate_jwt_token(user)
            
            # Serialize user data for response (excludes password)
            user_serializer = UserSerializer(user)
            
            # Return 200 OK with token and user data
            return Response(
                {
                    'token': token,
                    'user': user_serializer.data
                },
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            # Handle unexpected errors - return 500
            # Note: Do not log password in error messages
            logger.error(
                f"Login failed - unexpected error (email: {email}): {str(e)}",
                exc_info=True
            )
            return Response(
                {'error': 'An error occurred during login. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
