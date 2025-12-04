# Requirements Document

## Introduction

This specification defines the backend API endpoints and frontend integration for user authentication in AliceTant. The system must provide RESTful API endpoints for user registration (signup) and authentication (login), connecting the existing frontend forms with the backend user management system.

## Glossary

- **API Endpoint**: A specific URL path that accepts HTTP requests and returns responses
- **Authentication**: The process of verifying a user's identity through credentials
- **Registration**: The process of creating a new user account in the system
- **JWT Token**: JSON Web Token used for maintaining authenticated sessions
- **AliceTant System**: The appointment-booking web application
- **User Repository**: Backend data access layer for user operations
- **Django REST Framework**: Python framework for building RESTful APIs
- **HTTP Status Code**: Numeric code indicating the result of an HTTP request
- **Request Payload**: Data sent in the body of an HTTP request
- **Response Payload**: Data returned in the body of an HTTP response

## Requirements

### Requirement 1

**User Story:** As a new user, I want to submit my signup form to create an account, so that I can access the AliceTant system.

#### Acceptance Criteria

1. WHEN a user submits valid signup data, THE AliceTant System SHALL create a new user account in the database
2. WHEN a user submits valid signup data, THE AliceTant System SHALL return HTTP status code 201 with user details
3. WHEN a user submits signup data with an existing email, THE AliceTant System SHALL return HTTP status code 409 with an error message
4. WHEN a user submits signup data with an existing username, THE AliceTant System SHALL return HTTP status code 409 with an error message
5. WHEN a user submits invalid signup data, THE AliceTant System SHALL return HTTP status code 400 with validation error details

### Requirement 2

**User Story:** As a new user, I want my password to be securely stored, so that my account remains protected.

#### Acceptance Criteria

1. WHEN the system stores a user password, THE AliceTant System SHALL hash the password using Django's authentication system
2. THE AliceTant System SHALL NOT store passwords in plain text
3. THE AliceTant System SHALL NOT return password hashes in API responses

### Requirement 3

**User Story:** As a new user, I want to receive appropriate role-specific profiles, so that I can use features relevant to my role.

#### Acceptance Criteria

1. WHEN a user registers with role CUSTOMER, THE AliceTant System SHALL create a Customer profile linked to the user
2. WHEN a user registers with role PROVIDER, THE AliceTant System SHALL create a Provider profile linked to the user
3. WHEN profile creation fails, THE AliceTant System SHALL rollback the user creation and return HTTP status code 500

### Requirement 4

**User Story:** As a returning user, I want to submit my login credentials to authenticate, so that I can access my account.

#### Acceptance Criteria

1. WHEN a user submits valid login credentials, THE AliceTant System SHALL verify the credentials against stored user data
2. WHEN a user submits valid login credentials, THE AliceTant System SHALL return HTTP status code 200 with authentication token and user details
3. WHEN a user submits invalid credentials, THE AliceTant System SHALL return HTTP status code 401 with an error message
4. WHEN a user submits login data with missing fields, THE AliceTant System SHALL return HTTP status code 400 with validation error details

### Requirement 5

**User Story:** As an authenticated user, I want to receive a session token, so that I can make authenticated requests to the system.

#### Acceptance Criteria

1. WHEN a user successfully logs in, THE AliceTant System SHALL generate a JWT authentication token
2. WHEN a user successfully logs in, THE AliceTant System SHALL include the JWT token in the response payload
3. THE AliceTant System SHALL include user details in the login response including id, username, email, and role

### Requirement 6

**User Story:** As a frontend developer, I want consistent API response formats, so that I can reliably handle responses.

#### Acceptance Criteria

1. WHEN an API request succeeds, THE AliceTant System SHALL return a JSON response with consistent structure
2. WHEN an API request fails, THE AliceTant System SHALL return a JSON response with an error field containing error details
3. THE AliceTant System SHALL set Content-Type header to application/json for all API responses
4. THE AliceTant System SHALL enable CORS headers to allow frontend requests from the development server

### Requirement 7

**User Story:** As a system administrator, I want comprehensive error logging, so that I can debug issues and monitor system health.

#### Acceptance Criteria

1. WHEN an API endpoint encounters an error, THE AliceTant System SHALL log the error with relevant context
2. WHEN a user registration fails, THE AliceTant System SHALL log the failure reason
3. WHEN a user login fails, THE AliceTant System SHALL log the failure reason without logging passwords

### Requirement 8

**User Story:** As a frontend developer, I want the signup API to accept data in the format my form sends, so that integration is seamless.

#### Acceptance Criteria

1. THE AliceTant System SHALL accept a POST request at endpoint /api/auth/signup/
2. THE AliceTant System SHALL accept JSON payload with fields: full_name, email, phone_number, password, role
3. WHEN phone_number is null or empty, THE AliceTant System SHALL accept the registration without requiring phone_number
4. THE AliceTant System SHALL derive username from email address for user creation

### Requirement 9

**User Story:** As a frontend developer, I want the login API to accept data in the format my form sends, so that integration is seamless.

#### Acceptance Criteria

1. THE AliceTant System SHALL accept a POST request at endpoint /api/auth/login/
2. THE AliceTant System SHALL accept JSON payload with fields: email, password
3. THE AliceTant System SHALL authenticate users using email and password combination
