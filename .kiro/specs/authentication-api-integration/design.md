# Design Document

## Overview

The authentication API integration feature provides RESTful API endpoints for user registration and login, connecting the existing React frontend with the Django backend. The design leverages Django REST Framework for API implementation, uses the existing UserRepository for data access, and implements JWT-based authentication for session management. The system ensures secure password handling, proper error responses, and CORS configuration for frontend-backend communication.

## Architecture

The authentication API follows a layered architecture:

1. **API Layer (Views)**: Django REST Framework APIView classes that handle HTTP requests/responses
2. **Service Layer**: Business logic for user registration and authentication
3. **Repository Layer**: Existing UserRepository for database operations
4. **Serializer Layer**: DRF serializers for request validation and response formatting
5. **Authentication Layer**: JWT token generation and validation
6. **CORS Configuration**: Django CORS headers middleware for cross-origin requests

**Request Flow**:
```
Frontend (React) 
  → HTTP Request (JSON)
  → Django CORS Middleware
  → URL Router
  → API View
  → Serializer (validation)
  → Service Layer
  → Repository Layer
  → Database
  → Response (JSON)
  → Frontend
```

## Components and Interfaces

### API Endpoints

#### Signup Endpoint
- **URL**: `/api/auth/signup/`
- **Method**: POST
- **Request Body**:
```json
{
  "full_name": "string (required, 2-64 chars)",
  "email": "string (required, valid email)",
  "phone_number": "string (optional)",
  "password": "string (required, min 8 chars)",
  "role": "string (required, 'customer' or 'provider')"
}
```
- **Success Response** (201 Created):
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "role": "string",
  "full_name": "string",
  "created_at": "datetime"
}
```
- **Error Responses**:
  - 400 Bad Request: Invalid data
  - 409 Conflict: Duplicate email/username
  - 500 Internal Server Error: Server error

#### Login Endpoint
- **URL**: `/api/auth/login/`
- **Method**: POST
- **Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```
- **Success Response** (200 OK):
```json
{
  "token": "string (JWT)",
  "user": {
    "id": "integer",
    "username": "string",
    "email": "string",
    "role": "string",
    "full_name": "string"
  }
}
```
- **Error Responses**:
  - 400 Bad Request: Missing fields
  - 401 Unauthorized: Invalid credentials
  - 500 Internal Server Error: Server error

### Serializers

#### SignupSerializer (`/backend/AliceTant/serializers/auth_serializers.py`)

**Purpose**: Validates and deserializes signup request data

**Fields**:
```python
{
    'full_name': CharField(required=True, min_length=2, max_length=64),
    'email': EmailField(required=True),
    'phone_number': CharField(required=False, allow_blank=True, allow_null=True),
    'password': CharField(required=True, min_length=8, write_only=True),
    'role': ChoiceField(choices=['customer', 'provider'], required=True)
}
```

**Methods**:
- `validate_email(value)`: Checks email format and uniqueness
- `validate_password(value)`: Validates password strength
- `validate_role(value)`: Normalizes role to uppercase (CUSTOMER/PROVIDER)
- `create(validated_data)`: Creates user and role-specific profile

#### LoginSerializer (`/backend/AliceTant/serializers/auth_serializers.py`)

**Purpose**: Validates login request data

**Fields**:
```python
{
    'email': EmailField(required=True),
    'password': CharField(required=True, write_only=True)
}
```

**Methods**:
- `validate(attrs)`: Authenticates user credentials

#### UserSerializer (`/backend/AliceTant/serializers/auth_serializers.py`)

**Purpose**: Serializes user data for responses

**Fields**:
```python
{
    'id': IntegerField(read_only=True),
    'username': CharField(read_only=True),
    'email': EmailField(read_only=True),
    'role': CharField(read_only=True),
    'full_name': CharField(read_only=True),
    'created_at': DateTimeField(read_only=True)
}
```

### API Views

#### SignupView (`/backend/AliceTant/views/auth_views.py`)

**Purpose**: Handles user registration requests

**Methods**:
- `post(request)`: Processes signup requests
  - Validates request data using SignupSerializer
  - Generates username from email
  - Creates user via UserRepository
  - Creates role-specific profile (Customer/Provider)
  - Returns user data with 201 status
  - Handles errors and returns appropriate status codes

#### LoginView (`/backend/AliceTant/views/auth_views.py`)

**Purpose**: Handles user authentication requests

**Methods**:
- `post(request)`: Processes login requests
  - Validates request data using LoginSerializer
  - Authenticates user credentials
  - Generates JWT token
  - Returns token and user data with 200 status
  - Handles errors and returns appropriate status codes

### Service Layer

#### AuthService (`/backend/AliceTant/services/auth_service.py`)

**Purpose**: Encapsulates authentication business logic

**Methods**:
- `register_user(full_name, email, phone_number, password, role)`: 
  - Generates username from email
  - Creates user via repository
  - Creates role-specific profile
  - Returns created user
  - Uses transaction for atomicity

- `authenticate_user(email, password)`:
  - Retrieves user by email
  - Verifies password
  - Returns user if valid, None otherwise

- `generate_username(email)`:
  - Extracts local part from email
  - Ensures uniqueness by appending numbers if needed
  - Returns unique username

- `generate_jwt_token(user)`:
  - Creates JWT payload with user data
  - Signs token with secret key
  - Returns token string

## Data Models

### Signup Request Data
```python
{
    'full_name': str,      # Required, 2-64 characters
    'email': str,          # Required, valid email format
    'phone_number': str,   # Optional, can be null/empty
    'password': str,       # Required, min 8 chars, will be hashed
    'role': str           # Required, 'customer' or 'provider'
}
```

### Login Request Data
```python
{
    'email': str,     # Required, valid email format
    'password': str   # Required, plain text (verified against hash)
}
```

### User Response Data
```python
{
    'id': int,
    'username': str,
    'email': str,
    'role': str,           # 'CUSTOMER' or 'PROVIDER'
    'full_name': str,
    'created_at': datetime
}
```

### Login Response Data
```python
{
    'token': str,          # JWT token
    'user': {
        'id': int,
        'username': str,
        'email': str,
        'role': str,
        'full_name': str
    }
}
```

### Error Response Data
```python
{
    'error': str,                    # Error message
    'details': dict (optional)       # Additional error details
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, I identified the following redundancies:
- Properties 2.1 and 2.2 both test password hashing (combined into Property 2)
- Properties 5.1 and 5.2 both test JWT token in response (combined into Property 5)
- Property 9.3 duplicates 4.1 for authentication (removed)

### Property 1: Valid signup creates user in database

*For any* valid signup data (full_name, email, phone_number, password, role), submitting the data should result in a new user existing in the database with matching details.

**Validates: Requirements 1.1**

### Property 2: Valid signup returns 201 with user details

*For any* valid signup data, the API response should have status code 201 and include user details (id, username, email, role, full_name, created_at).

**Validates: Requirements 1.2**

### Property 3: Duplicate email returns 409

*For any* existing user, attempting to register another user with the same email should return status code 409 with an error message.

**Validates: Requirements 1.3**

### Property 4: Duplicate username returns 409

*For any* existing user, attempting to register another user with the same username should return status code 409 with an error message.

**Validates: Requirements 1.4**

### Property 5: Invalid signup data returns 400

*For any* invalid signup data (missing required fields, invalid email format, weak password), the API should return status code 400 with validation error details.

**Validates: Requirements 1.5**

### Property 6: Passwords are hashed in storage

*For any* user registration, the password stored in the database should be hashed (not equal to the plain text password provided).

**Validates: Requirements 2.1, 2.2**

### Property 7: Password hashes never appear in responses

*For any* API response (signup, login, user details), the response should not contain password or password hash fields.

**Validates: Requirements 2.3**

### Property 8: Customer registration creates Customer profile

*For any* signup with role 'customer', a Customer profile should be created and linked to the user.

**Validates: Requirements 3.1**

### Property 9: Provider registration creates Provider profile

*For any* signup with role 'provider', a Provider profile should be created and linked to the user.

**Validates: Requirements 3.2**

### Property 10: Profile creation failure rolls back user creation

*For any* signup where profile creation fails, the user should not exist in the database (transaction rollback).

**Validates: Requirements 3.3**

### Property 11: Valid credentials authenticate successfully

*For any* registered user, logging in with the correct email and password should return status code 200 with a token and user details.

**Validates: Requirements 4.1, 4.2**

### Property 12: Invalid credentials return 401

*For any* login attempt with incorrect password or non-existent email, the API should return status code 401 with an error message.

**Validates: Requirements 4.3**

### Property 13: Missing login fields return 400

*For any* login request with missing email or password, the API should return status code 400 with validation error details.

**Validates: Requirements 4.4**

### Property 14: Successful login includes JWT token

*For any* successful login, the response should include a valid JWT token in the 'token' field.

**Validates: Requirements 5.1, 5.2**

### Property 15: Login response includes required user fields

*For any* successful login, the response should include user details with fields: id, username, email, role, and full_name.

**Validates: Requirements 5.3**

### Property 16: Success responses have consistent JSON structure

*For any* successful API request, the response should be valid JSON with consistent field structure.

**Validates: Requirements 6.1**

### Property 17: Error responses include error field

*For any* failed API request, the response should be valid JSON containing an 'error' field with error details.

**Validates: Requirements 6.2**

### Property 18: All responses have JSON content type

*For any* API response (success or error), the Content-Type header should be 'application/json'.

**Validates: Requirements 6.3**

### Property 19: Phone number is optional

*For any* signup request with null or empty phone_number, the registration should succeed without requiring phone_number.

**Validates: Requirements 8.3**

### Property 20: Username derived from email

*For any* user registration, the username should be derived from the email address (local part before @).

**Validates: Requirements 8.4**


## Error Handling

### Validation Errors (400 Bad Request)

**Signup Validation Errors**:
- Missing required fields: `{"error": "Field 'full_name' is required"}`
- Invalid email format: `{"error": "Enter a valid email address"}`
- Weak password: `{"error": "Password must be at least 8 characters"}`
- Invalid role: `{"error": "Invalid role. Must be 'customer' or 'provider'"}`
- Full name too short: `{"error": "Full name must be at least 2 characters"}`

**Login Validation Errors**:
- Missing email: `{"error": "Field 'email' is required"}`
- Missing password: `{"error": "Field 'password' is required"}`
- Invalid email format: `{"error": "Enter a valid email address"}`

### Authentication Errors (401 Unauthorized)

- Invalid credentials: `{"error": "Invalid email or password"}`
- User not found: `{"error": "Invalid email or password"}` (same message for security)

### Conflict Errors (409 Conflict)

- Duplicate email: `{"error": "User with email 'user@example.com' already exists"}`
- Duplicate username: `{"error": "User with username 'user' already exists"}`

### Server Errors (500 Internal Server Error)

- Profile creation failure: `{"error": "Failed to create user profile"}`
- Database errors: `{"error": "An error occurred. Please try again later"}`
- Unexpected errors: `{"error": "Internal server error"}`

### Error Logging Strategy

- Log all 500 errors with full stack trace
- Log 409 errors with attempted email/username (not password)
- Log 401 errors with attempted email (not password)
- Do not log 400 validation errors (too noisy)
- Include request ID in logs for tracing
- Use Django's logging framework with appropriate log levels

## Testing Strategy

Testing for this feature will be handled separately and is not included in this implementation plan.

## Implementation Notes

### Username Generation

The username should be derived from the email address:
```python
def generate_username(email: str) -> str:
    """Generate unique username from email."""
    base_username = email.split('@')[0]
    username = base_username
    counter = 1
    
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1
    
    return username
```

### JWT Token Generation

Use PyJWT library for token generation:
```python
import jwt
from datetime import datetime, timedelta
from django.conf import settings

def generate_jwt_token(user: User) -> str:
    """Generate JWT token for authenticated user."""
    payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token
```

### Transaction Management

Use Django's transaction.atomic for atomicity:
```python
from django.db import transaction

@transaction.atomic
def register_user(full_name, email, phone_number, password, role):
    """Register user with profile creation in transaction."""
    # Create user
    user = UserRepository.create_user(...)
    
    # Create role-specific profile
    if role == 'CUSTOMER':
        UserRepository.create_customer(user, full_name, phone_number=phone_number)
    else:
        UserRepository.create_provider(user, business_name=full_name)
    
    return user
```

### CORS Configuration

Install and configure django-cors-headers:
```python
# settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:5174",  # Alternative port
]

CORS_ALLOW_CREDENTIALS = True
```

### API Response Format

**Success Response Helper**:
```python
from rest_framework.response import Response
from rest_framework import status

def success_response(data, status_code=status.HTTP_200_OK):
    """Return successful API response."""
    return Response(data, status=status_code)
```

**Error Response Helper**:
```python
def error_response(message, status_code=status.HTTP_400_BAD_REQUEST, details=None):
    """Return error API response."""
    response_data = {'error': message}
    if details:
        response_data['details'] = details
    return Response(response_data, status=status_code)
```

### Password Security

- Use Django's `make_password()` for hashing
- Use Django's `check_password()` for verification
- Never log passwords or password hashes
- Use `write_only=True` for password fields in serializers
- Exclude password from all serializer outputs

### Frontend Integration

Update `frontend/src/utils/api.js`:
```javascript
// Signup API call
export const signup = async (userData) => {
  const response = await api.post('/auth/signup/', userData);
  return response.data;
};

// Login API call
export const login = async (credentials) => {
  const response = await api.post('/auth/login/', credentials);
  return response.data;
};
```

Update signup/login components to use API:
```javascript
// In Signup.jsx
import { signup } from '../utils/api';

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  
  setIsSubmitting(true);
  try {
    const response = await signup({
      full_name: formData.fullName,
      email: formData.email,
      phone_number: formData.phoneNumber || null,
      password: formData.password,
      role: formData.role
    });
    
    // Store user data and redirect
    console.log('Signup successful:', response);
    // TODO: Store token, redirect to dashboard
  } catch (error) {
    if (error.response?.status === 409) {
      setErrors({ general: 'An account with this email already exists' });
    } else if (error.response?.status === 400) {
      setErrors({ general: error.response.data.error });
    } else {
      setErrors({ general: 'Something went wrong. Please try again.' });
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

### Django Settings Updates

Add to `settings.py`:
```python
# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}

# JWT Secret Key (use environment variable in production)
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8}
    },
]
```

### URL Configuration

Update `backend/AliceTant/urls.py`:
```python
from django.urls import path
from .views import auth_views

urlpatterns = [
    path('auth/signup/', auth_views.SignupView.as_view(), name='signup'),
    path('auth/login/', auth_views.LoginView.as_view(), name='login'),
]
```

### Dependencies

Add to `backend/requirements.txt`:
```
djangorestframework==3.14.0
django-cors-headers==4.3.1
PyJWT==2.8.0
```
