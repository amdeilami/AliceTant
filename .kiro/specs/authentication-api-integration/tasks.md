# Implementation Plan

- [x] 1. Install required backend dependencies
  - Add djangorestframework to requirements.txt
  - Add django-cors-headers to requirements.txt
  - Add PyJWT to requirements.txt
  - Install dependencies using pip
  - _Requirements: 6.4_

- [x] 2. Configure Django settings for API and CORS
  - Add 'rest_framework' to INSTALLED_APPS
  - Add 'corsheaders' to INSTALLED_APPS
  - Add CorsMiddleware to MIDDLEWARE
  - Configure CORS_ALLOWED_ORIGINS for frontend dev server
  - Configure REST_FRAMEWORK settings for JSON rendering
  - _Requirements: 6.3, 6.4_

- [x] 3. Create authentication service layer
  - Create /backend/AliceTant/services/auth_service.py file
  - Implement generate_username() method to derive username from email
  - Implement generate_jwt_token() method for JWT creation
  - Implement register_user() method with transaction management
  - Implement authenticate_user() method for credential verification
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3, 4.1, 5.1, 8.4_

- [x] 4. Create serializers for authentication
  - Create /backend/AliceTant/serializers/ directory
  - Create /backend/AliceTant/serializers/__init__.py file
  - Create /backend/AliceTant/serializers/auth_serializers.py file
  - Implement SignupSerializer with validation for all fields
  - Implement LoginSerializer with email and password validation
  - Implement UserSerializer for response formatting
  - _Requirements: 1.5, 4.4, 6.1, 8.2, 9.2_

- [x] 5. Create signup API view
  - Create /backend/AliceTant/views/ directory
  - Create /backend/AliceTant/views/__init__.py file
  - Create /backend/AliceTant/views/auth_views.py file
  - Implement SignupView class extending APIView
  - Implement post() method for signup requests
  - Handle validation errors and return 400 responses
  - Handle duplicate email/username and return 409 responses
  - Handle success and return 201 with user data
  - Ensure passwords are not included in responses
  - Add error logging for failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.3, 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 7.2, 8.1, 8.2, 8.3_

- [x] 6. Create login API view
  - Implement LoginView class in auth_views.py
  - Implement post() method for login requests
  - Handle validation errors and return 400 responses
  - Handle invalid credentials and return 401 responses
  - Handle success and return 200 with token and user data
  - Ensure passwords are not included in responses
  - Add error logging for failures (without passwords)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.3, 9.1, 9.2, 9.3_

- [x] 7. Configure URL routing for authentication endpoints
  - Update /backend/AliceTant/urls.py to include auth routes
  - Add route for /api/auth/signup/ pointing to SignupView
  - Add route for /api/auth/login/ pointing to LoginView
  - _Requirements: 8.1, 9.1_

- [x] 8. Update frontend API utility (with tests)
  - Update /frontend/src/utils/api.js with correct backend URL (currently set to port 5174, should be 8000)
  - Add signup() function for signup API calls
  - Add login() function for login API calls
  - Add comprehensive tests for API functions
  - _Requirements: 1.1, 4.1_

- [x] 9. Integrate signup page with backend API
  - Update /frontend/src/pages/Signup.jsx handleSubmit method
  - Replace console.log with actual API call to signup()
  - Handle 201 success response (store user data, show success)
  - Handle 409 conflict error (show duplicate email message)
  - Handle 400 validation error (show validation messages)
  - Handle network errors (show connection error)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.3_

- [x] 9. Integrate signup page with backend API (with tests)

- [x] 10. Integrate login page with backend API
  - Update /frontend/src/pages/Login.jsx handleSubmit method
  - Replace console.log with actual API call to login()
  - Handle 200 success response (store token and user data, redirect)
  - Handle 401 unauthorized error (show invalid credentials message)
  - Handle 400 validation error (show validation messages)
  - Handle network errors (show connection error)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 9.1, 9.2, 9.3_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: All_
