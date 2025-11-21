# Requirements Document

## Introduction

This specification defines the user data model and database interface layer for AliceTant, an appointment-booking system. The system must support two distinct user roles (Provider and Customer) with role-based capabilities, while maintaining strong data consistency and providing a clean separation between business logic and database operations.

## Glossary

- **User**: Any authenticated person using the AliceTant system
- **Provider**: A business owner who defines availability and manages appointment slots
- **Customer**: A client who views available time slots and books appointments
- **Repository**: A database interface layer that abstracts data access operations
- **AliceTant System**: The appointment-booking web application
- **User Model**: The data structure representing user information in the database
- **Authentication Credentials**: Username and password used for user login

## Requirements

### Requirement 1

**User Story:** As a system architect, I want a unified user model with role differentiation, so that both providers and customers can authenticate and access role-appropriate features.

#### Acceptance Criteria

1. THE AliceTant System SHALL store user information including username, email, password hash, and role designation
2. WHEN a user is created, THE AliceTant System SHALL assign exactly one role from the set {Provider, Customer}
3. THE AliceTant System SHALL enforce unique constraints on username and email fields
4. WHEN storing passwords, THE AliceTant System SHALL hash passwords before persistence
5. THE AliceTant System SHALL maintain timestamps for user creation and last modification

### Requirement 2

**User Story:** As a provider, I want to have additional profile information stored, so that customers can learn about my business and contact me.

#### Acceptance Criteria

1. WHEN a user has the Provider role, THE AliceTant System SHALL store additional fields including business name, bio, and contact information
2. THE AliceTant System SHALL allow provider bio text up to 4096 characters
3. THE AliceTant System SHALL store provider contact information including phone number and address
4. WHEN provider information is updated, THE AliceTant System SHALL preserve the user's core authentication credentials

### Requirement 3

**User Story:** As a customer, I want my booking history and preferences stored, so that providers can recognize me and I can track my appointments.

#### Acceptance Criteria

1. WHEN a user has the Customer role, THE AliceTant System SHALL store customer-specific fields including full name and phone number
2. THE AliceTant System SHALL maintain a relationship between customers and their appointment bookings
3. THE AliceTant System SHALL allow optional customer preferences to be stored

### Requirement 4

**User Story:** As a developer, I want a repository layer that abstracts database operations, so that the system remains maintainable and database-agnostic.

#### Acceptance Criteria

1. THE AliceTant System SHALL provide a repository interface for all user data access operations
2. WHEN business logic requires user data, THE AliceTant System SHALL access it exclusively through repository methods
3. THE AliceTant System SHALL implement repository methods for create, read, update, and delete operations
4. WHEN a repository method fails, THE AliceTant System SHALL raise appropriate exceptions without exposing database implementation details, there is a separate `exceptions` directory for methods with suitable message and error handling.
5. THE AliceTant System SHALL ensure repository methods return consistent data types regardless of underlying database

### Requirement 5

**User Story:** As a system administrator, I want strong data consistency guarantees, so that user data remains accurate and no duplicate accounts are created.

#### Acceptance Criteria

1. WHEN creating a new user with an existing username, THE AliceTant System SHALL reject the operation and signal an error
2. WHEN creating a new user with an existing email, THE AliceTant System SHALL reject the operation and signal an error
3. WHEN creating a new user with an invalid email format, THE AliceTant System SHALL reject the operation and signal an error
4. WHEN creating a new user with an invalid password format, THE AliceTant System SHALL reject the operation and signal an error
5. There should be options to create user with Google OAuth, Apple OAuth, Facebook OAuth, or email/password
6. WHEN updating user information, THE AliceTant System SHALL validate all constraints before persisting changes
7. THE AliceTant System SHALL ensure atomic operations for user creation and updates
8. WHEN concurrent operations attempt to modify the same user, THE AliceTant System SHALL prevent data corruption

### Requirement 6

**User Story:** As a developer, I want clear error handling for database operations, so that I can provide meaningful feedback to users and debug issues effectively.

#### Acceptance Criteria

1. WHEN a user is not found in the database, THE AliceTant System SHALL raise a UserNotFound exception
2. WHEN a unique constraint is violated, THE AliceTant System SHALL raise a DuplicateUser exception
3. WHEN database operations fail, THE AliceTant System SHALL raise exceptions with descriptive error messages
4. THE AliceTant System SHALL distinguish between validation errors and database errors in exception types

### Requirement 7

**User Story:** As a developer, I want to query users by various criteria, so that I can implement search and filtering features efficiently.

#### Acceptance Criteria

1. THE AliceTant System SHALL provide repository methods to retrieve users by username
2. THE AliceTant System SHALL provide repository methods to retrieve users by email
3. THE AliceTant System SHALL provide repository methods to retrieve users by role
4. THE AliceTant System SHALL provide repository methods to retrieve all users with pagination support
5. WHEN querying users, THE AliceTant System SHALL return results in a consistent format
