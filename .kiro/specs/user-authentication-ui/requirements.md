# Requirements Document

## Introduction

This specification defines the user authentication user interface for AliceTant, focusing on the signup and login pages for frontend only. The system must provide an intuitive, accessible interface for users to create accounts and authenticate, supporting both providers and customers with appropriate role selection.

## Glossary

- **Signup Page**: The user interface where new users create an account
- **Login Page**: The user interface where existing users authenticate
- **User**: Any person interacting with the AliceTant System Front
- **Provider**: A business owner who defines availability and manages appointment slots
- **Customer**: A client who views available time slots and books appointments
- **Form Validation**: Client-side checking of user input before submission
- **AliceTant System Front**: The appointment-booking web application front-end
- **Authentication**: The process of verifying a user's identity

## Requirements

### Requirement 1

**User Story:** As a new user, I want to access a signup page from the homepage, so that I can create an account to use AliceTant.

#### Acceptance Criteria

1. WHEN a user clicks the signup button on the homepage, THE AliceTant System Front SHALL navigate to the signup page
2. THE AliceTant System Front SHALL display the signup page at the route `/signup`
3. THE AliceTant System Front SHALL render the signup page with a clear, accessible layout

### Requirement 2

**User Story:** As a new user, I want to provide my basic information on the signup page, so that I can create an account with the necessary details.

#### Acceptance Criteria

1. THE AliceTant System Front SHALL display a full name input field on the signup page
2. THE AliceTant System Front SHALL display an email address input field on the signup page
3. THE AliceTant System Front SHALL display a phone number input field marked as optional on the signup page
4. THE AliceTant System Front SHALL display a password input field on the signup page
5. THE AliceTant System Front SHALL display a confirm password input field on the signup page
6. THE AliceTant System Front SHALL display a role selection control with options for Customer and Provider
7. THE AliceTant System Front SHALL display a submit button to create the account

### Requirement 3

**User Story:** As a new user, I want to see validation feedback on my input, so that I can correct any errors before submitting the form.

#### Acceptance Criteria

1. WHEN a user enters an invalid email format, THE AliceTant System Front SHALL display an error message indicating the email is invalid
2. WHEN a user leaves a required field empty and attempts to submit, THE AliceTant System Front SHALL display an error message indicating which fields are required
3. WHEN a user enters a password that does not meet requirements, THE AliceTant System Front SHALL display an error message with password requirements
4. WHEN a user enters fills the confirm password field with a different password than the password field, THE AliceTant System Front SHALL display an error message indicating the passwords do not match
5. THE AliceTant System Front SHALL display validation errors near the relevant input fields
6. THE AliceTant System Front must have an API endpoint for when an account is already existing in the database, and the user must be notified of the error

### Requirement 4

**User Story:** As a new user, I want to navigate to the login page if I already have an account, so that I don't need to create a duplicate account.

#### Acceptance Criteria

1. THE AliceTant System Front SHALL display a link to the login page on the signup page
2. THE AliceTant System Front SHALL label the login link with text "Already have an account? Login here"
3. WHEN a user clicks the login link, THE AliceTant System Front SHALL navigate to the login page

### Requirement 5

**User Story:** As a returning user, I want to access a login page from the homepage, so that I can authenticate my account.

#### Acceptance Criteri
1. In the login page, there should be a link to the signup page.
2. The signup link should be labeled as "Don't have an account? Sign up here".
3. When the user clicks the signup link, they should be navigated to the signup page.
4. There should be loging options using Google and Facebook OAuth.

### Requirement 6

**User Story:** As a returning user, I want to provide my email and password on the login page, so that I can authenticate my account.

#### Acceptance Criteri
1. The login page should have an input field for the user's email.
2. The login page should have an input field for the user's password.
3. The login page should have a submit button labeled "Login".
4. When the user submits the form, the AliceTant System Front should validate the input fields.
5. If the input fields are valid, the frontend should send a request to the backend for authentication.
6. If the input fields are invalid, the system should display an error message.

