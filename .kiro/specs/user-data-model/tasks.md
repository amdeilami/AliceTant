# Implementation Plan

- [x] 1. Configure Django custom user model
  - Update `settings.py` to set `AUTH_USER_MODEL = 'AliceTant.User'`
  - Ensure this is done before any migrations are created
  - _Requirements: 1.1, 1.2_

- [x] 2. Create custom exceptions
  - [x] 2.1 Implement user exception classes
    - Create `backend/AliceTant/exceptions/user_exceptions.py`
    - Define `UserNotFoundError`, `DuplicateUserError`, and `InvalidUserDataError` exception classes
    - Add docstrings explaining when each exception should be raised
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 3. Implement User model
  - [x] 3.1 Create User model with role support
    - Create `backend/AliceTant/models/user.py`
    - Define `UserRole` choices (PROVIDER, CUSTOMER)
    - Implement `User` model extending `AbstractUser`
    - Add role, email (unique), created_at, and updated_at fields
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [x] 3.2 Write property test for User model
    - **Property 1: User creation round trip**
    - **Property 2: Role assignment validity**
    - **Property 4: Password hashing**
    - **Property 5: Timestamp management**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5**
  
  - [x] 3.3 Write unit tests for User model edge cases
    - Test email uniqueness constraint
    - Test username uniqueness constraint
    - Test role validation (only PROVIDER or CUSTOMER allowed)
    - Test password hashing on user creation
    - _Requirements: 1.3, 1.4_

- [x] 4. Implement Provider model
  - [x] 4.1 Create Provider profile model
    - Create `backend/AliceTant/models/provider.py`
    - Implement `Provider` model with OneToOne relationship to User
    - Add business_name, bio (max 4096 chars), phone_number, and address fields
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 4.2 Write property test for Provider model
    - **Property 6: Provider profile completeness**
    - **Property 7: Provider update preserves credentials**
    - **Validates: Requirements 2.1, 2.3, 2.4**
  
  - [x] 4.3 Write unit tests for Provider model
    - Test bio length constraint (exactly 4096 chars, not 4097 chars)
    - Test cascade delete when user is deleted
    - Test that provider profile requires user with PROVIDER role
    - _Requirements: 2.2_

- [x] 5. Implement Customer model
  - [x] 5.1 Create Customer profile model
    - Create `backend/AliceTant/models/customer.py`
    - Implement `Customer` model with OneToOne relationship to User
    - Add full_name, phone_number, and preferences fields
    - _Requirements: 3.1, 3.3_
  
  - [x] 5.2 Write property test for Customer model
    - **Property 8: Customer profile completeness**
    - **Validates: Requirements 3.1, 3.3**
  
  - [x] 5.3 Write unit tests for Customer model
    - Test cascade delete when user is deleted
    - Test that customer profile requires user with CUSTOMER role
    - Test optional preferences field
    - _Requirements: 3.1, 3.3_

- [x] 6. Update models __init__.py
  - Import and expose User, Provider, and Customer models in `backend/AliceTant/models/__init__.py`
  - This makes models accessible as `from AliceTant.models import User`
  - _Requirements: 1.1_

- [x] 7. Create and run initial migrations
  - Generate Django migrations for User, Provider, and Customer models
  - Run migrations to create database tables
  - Verify database schema matches design
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 8. Implement UserRepository
  - [x] 8.1 Create repository with user creation methods
    - Create `backend/AliceTant/repositories/user_repository.py`
    - Implement `create_user()` method with password hashing
    - Implement `create_provider()` method
    - Implement `create_customer()` method
    - Add proper exception handling and validation
    - _Requirements: 4.3, 4.4, 5.1, 5.2, 5.3_
  
  - [x] 8.2 Implement user retrieval methods
    - Implement `get_user_by_id()` method
    - Implement `get_user_by_username()` method
    - Implement `get_user_by_email()` method
    - Implement `get_users_by_role()` method
    - Implement `get_all_users()` with pagination
    - Raise `UserNotFoundError` when user doesn't exist
    - _Requirements: 4.3, 6.1, 7.1, 7.2, 7.3, 7.4_
  
  - [x] 8.3 Implement user update and delete methods
    - Implement `update_user()` method with validation
    - Implement `delete_user()` method
    - Implement `user_exists()` helper method
    - _Requirements: 4.3, 5.3_
  
  - [x] 8.4 Write property test for repository CRUD operations
    - **Property 3: Uniqueness enforcement**
    - **Property 9: CRUD operations consistency**
    - **Validates: Requirements 1.3, 4.3, 4.5, 5.1, 5.2**
  
  - [x] 8.5 Write property test for repository query operations
    - **Property 10: Query correctness**
    - **Property 11: Pagination correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
  
  - [x] 8.6 Write unit tests for repository error handling
    - Test `UserNotFoundError` is raised for non-existent users
    - Test `DuplicateUserError` is raised for duplicate username
    - Test `DuplicateUserError` is raised for duplicate email
    - Test `InvalidUserDataError` is raised for validation failures
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 9. Update repositories __init__.py
  - Import and expose UserRepository in `backend/AliceTant/repositories/__init__.py`
  - _Requirements: 4.1_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

<!-- - [ ] 11. Create test utilities and fixtures
  - [ ] 11.1 Create Hypothesis strategies for test data generation
    - Create `backend/AliceTant/tests/strategies.py`
    - Define strategies for usernames, emails, passwords, roles
    - Define strategies for provider and customer data
    - Configure Hypothesis to run minimum 100 iterations
    - _Requirements: All testing requirements_
  
  - [ ] 11.2 Create test fixtures for common scenarios
    - Create `backend/AliceTant/tests/fixtures.py`
    - Define fixtures for creating test users, providers, customers
    - Define fixtures for database cleanup
    - _Requirements: All testing requirements_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property-based tests
  - Verify all 12 correctness properties are validated
  - Ensure all tests pass, ask the user if questions arise. -->
