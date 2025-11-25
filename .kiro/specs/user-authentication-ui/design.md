# Design Document

## Overview

The user authentication UI feature provides both signup and login pages for the AliceTant system frontend. The design follows React best practices with functional components, hooks for state management, and client-side form validation. Both pages will be accessible via React Router and styled with Tailwind CSS to match the existing design system. This design focuses exclusively on the frontend implementation, with backend API integration to be handled separately.

## Architecture

The authentication UI follows a component-based architecture:

1. **Signup Page Component**: Main page component for user registration
2. **Login Page Component**: Main page component for user authentication
3. **Form State Management**: React hooks (useState) for managing form data and validation
4. **Client-Side Validation**: Form validation logic without backend dependency
5. **Routing**: React Router integration for navigation between signup, login, and home pages
6. **Layout Integration**: Uses the existing Layout component for consistent page structure
7. **OAuth Integration**: Social login buttons for Google and Facebook (UI only, backend integration separate)

## Components and Interfaces

### Signup Page Component (`/src/pages/Signup.jsx`)

**Purpose**: Renders the signup form and handles user registration flow

**Props**: None (route component)

**State**:
```javascript
{
  formData: {
    fullName: string,
    email: string,
    phoneNumber: string,
    password: string,
    confirmPassword: string,
    role: 'customer' | 'provider'
  },
  errors: {
    fullName?: string,
    email?: string,
    phoneNumber?: string,
    password?: string,
    confirmPassword?: string,
    general?: string
  },
  isSubmitting: boolean
}
```

**Key Methods**:
- `handleInputChange(field, value)`: Updates form data for a specific field
- `validateField(field, value)`: Validates a single field and updates errors
- `validateForm()`: Validates all form fields and returns boolean
- `handleSubmit(event)`: Processes form submission (frontend validation only)
- `handleRoleChange(role)`: Updates the selected role

### Login Page Component (`/src/pages/Login.jsx`)

**Purpose**: Renders the login form and handles user authentication flow

**Props**: None (route component)

**State**:
```javascript
{
  formData: {
    email: string,
    password: string
  },
  errors: {
    email?: string,
    password?: string,
    general?: string
  },
  isSubmitting: boolean
}
```

**Key Methods**:
- `handleInputChange(field, value)`: Updates form data for a specific field
- `validateField(field, value)`: Validates a single field and updates errors
- `validateForm()`: Validates all form fields and returns boolean
- `handleSubmit(event)`: Processes form submission (frontend validation only)
- `handleOAuthLogin(provider)`: Handles OAuth login button clicks (Google/Facebook)

### Route Configuration (`/src/App.jsx`)

**New Routes**:
```javascript
<Route path="/signup" element={<Signup />} />
<Route path="/login" element={<Login />} />
```

## Data Models

### Signup Form Data

```javascript
{
  fullName: string,        // Required, min 2 characters
  email: string,           // Required, valid email format
  phoneNumber: string,     // Optional, phone format if provided
  password: string,        // Required, min 8 characters
  confirmPassword: string, // Required, must match password
  role: 'customer' | 'provider'  // Required, defaults to 'customer'
}
```

### Login Form Data

```javascript
{
  email: string,    // Required, valid email format
  password: string  // Required, not empty
}
```

### Validation Rules

**Signup Form**:
- **fullName**: Required, minimum 2 characters, maximum 64 characters, no numbers allowed
- **email**: Required, must match email regex pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **phoneNumber**: Optional, if provided must be non-empty
- **password**: Required, minimum 8 characters, must contain at least one letter and one number
- **confirmPassword**: Required, must exactly match password field
- **role**: Required, must be either 'customer' or 'provider', defaults to 'customer'

**Login Form**:
- **email**: Required, must match email regex pattern
- **password**: Required, not empty

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Email validation follows standard format

*For any* string entered in the email field (signup or login), the validation should accept it if and only if it matches the standard email format pattern.

**Validates: Requirements 3.1, 6.4**

### Property 2: Password validation enforces security requirements

*For any* string entered in the password field on signup, the validation should accept it if and only if it meets the minimum length (8 characters) and complexity requirements (at least one letter and one number).

**Validates: Requirements 3.3**

### Property 3: Password confirmation must match

*For any* values entered in password and confirmPassword fields, the validation should pass if and only if both values are identical.

**Validates: Requirements 3.4**

### Property 4: Required field validation

*For any* required field left empty on form submission, the system should display an error message and prevent submission.

**Validates: Requirements 3.2**

### Property 5: Error messages display near relevant fields

*For any* validation error, the error message should be displayed adjacent to the corresponding form field in the DOM.

**Validates: Requirements 3.5**

### Property 6: Role selection maintains exactly one choice

*For any* interaction with the role selector on signup, exactly one role (customer or provider) should be selected at all times, with customer as the default.

**Validates: Requirements 2.6**

### Property 7: Navigation between signup and login preserves no form data

*For any* form state, when navigating between signup and login pages, no form data should be persisted or carried over.

**Validates: Requirements 4.3, 5.3**

## Error Handling

### Client-Side Validation Errors

**Signup Page**:
- **Full Name**: "Full name is required" / "Full name must be at least 2 characters"
- **Email**: "Email is required" / "Please enter a valid email address"
- **Phone Number**: No error if empty (optional field)
- **Password**: "Password is required" / "Password must be at least 8 characters and contain at least one letter and one number"
- **Confirm Password**: "Please confirm your password" / "Passwords do not match"
- **Role**: Always has a default value, no validation error

**Login Page**:
- **Email**: "Email is required" / "Please enter a valid email address"
- **Password**: "Password is required"

### Error Display Strategy

- Display inline error messages below each field
- Use red text (text-red-600) and red border colors (border-red-500) to indicate errors
- Prevent form submission until all validation errors are resolved
- Clear field-specific errors when user starts typing in that field
- Show validation errors on blur (when user leaves the field)
- Show all validation errors on submit attempt

### Future Backend Integration

When backend API is integrated:
- **Duplicate Email (409)**: Display "An account with this email already exists"
- **Network Errors**: Display "Unable to connect to server. Please check your connection."
- **Server Errors (500)**: Display "Something went wrong. Please try again later."
- Backend errors should be displayed at the top of the form in an alert box

## Testing Strategy

### Unit Tests

**Signup Form Validation Tests**:
- Test email validation with valid and invalid formats
- Test password validation with various strength levels
- Test password confirmation matching
- Test required field validation (fullName, email, password, confirmPassword)
- Test optional phone number field (should not error when empty)
- Test role selection default value

**Login Form Validation Tests**:
- Test email validation with valid and invalid formats
- Test required field validation (email, password)

**Component Rendering Tests**:
- Test that all signup form fields render correctly
- Test that all login form fields render correctly
- Test that role selector renders with both options (customer/provider)
- Test that navigation links render with correct text
- Test that OAuth buttons render on login page

**State Management Tests**:
- Test form data updates on input change
- Test error state updates on validation
- Test error clearing when user types in a field

**Navigation Tests**:
- Test that form data doesn't persist across navigation

### Property-Based Tests

The testing framework will use **Vitest** with **fast-check** for property-based testing.

Each property-based test should run a minimum of 100 iterations to ensure comprehensive coverage.

**Property Test 1: Email format validation**
- Generate random strings including valid and invalid emails
- Verify email validation correctly identifies valid formats
- **Feature: user-authentication-ui, Property 1: Email validation follows standard format**

**Property Test 2: Password strength validation**
- Generate random passwords with various characteristics
- Verify password validation correctly enforces requirements
- **Feature: user-authentication-ui, Property 2: Password validation enforces security requirements**

**Property Test 3: Password confirmation matching**
- Generate random password pairs (matching and non-matching)
- Verify confirmation validation correctly identifies matches
- **Feature: user-authentication-ui, Property 3: Password confirmation must match**

**Property Test 4: Required field validation**
- Generate random form states with various empty fields
- Verify required field validation catches all empty required fields
- **Feature: user-authentication-ui, Property 4: Required field validation**

**Property Test 5: Role selection state**
- Generate random sequences of role selection interactions
- Verify exactly one role is always selected with customer as default
- **Feature: user-authentication-ui, Property 6: Role selection maintains exactly one choice**

## UI/UX Design

### Signup Page Layout

```
┌─────────────────────────────────────┐
│           Header (Layout)            │
├─────────────────────────────────────┤
│                                      │
│     ┌─────────────────────────┐    │
│     │   Signup Form Card      │    │
│     │                         │    │
│     │  Full Name Input        │    │
│     │  Email Input            │    │
│     │  Phone Input (Optional) │    │
│     │  Password Input         │    │
│     │  Confirm Password Input │    │
│     │  Role Selection         │    │
│     │    ○ Customer           │    │
│     │    ○ Provider           │    │
│     │                         │    │
│     │  [Sign Up Button]       │    │
│     │                         │    │
│     │  Already have account?  │    │
│     │  Login here             │    │
│     └─────────────────────────┘    │
│                                      │
├─────────────────────────────────────┤
│           Footer (Layout)            │
└─────────────────────────────────────┘
```

### Login Page Layout

```
┌─────────────────────────────────────┐
│           Header (Layout)            │
├─────────────────────────────────────┤
│                                      │
│     ┌─────────────────────────┐    │
│     │   Login Form Card       │    │
│     │                         │    │
│     │  Email Input            │    │
│     │  Password Input         │    │
│     │                         │    │
│     │  [Login Button]         │    │
│     │                         │    │
│     │  ─── or login with ───  │    │
│     │                         │    │
│     │  [Google] [Facebook]    │    │
│     │                         │    │
│     │  Don't have account?    │    │
│     │  Sign up here           │    │
│     └─────────────────────────┘    │
│                                      │
├─────────────────────────────────────┤
│           Footer (Layout)            │
└─────────────────────────────────────┘
```

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow existing color scheme (indigo/purple gradient)
- Card-based form with shadow and rounded corners
- Consistent spacing (padding, margins)
- Focus states with visible outlines (ring-2 ring-indigo-500)
- Hover states for interactive elements
- Smooth transitions for state changes
- Error states with red borders and text
- Disabled states with reduced opacity

### Accessibility Features

- Semantic HTML elements (form, label, input)
- ARIA labels for screen readers
- Keyboard navigation support (tab order)
- Focus indicators on all interactive elements
- Error announcements for screen readers (aria-live regions)
- Sufficient color contrast (WCAG AA)
- Responsive text sizing
- Proper input types (email, password, tel)

## Implementation Notes

### Homepage Integration

The existing "Get Started" button on the homepage should be updated to navigate to `/signup`:

```javascript
import { useNavigate } from 'react-router-dom';

// Inside component
const navigate = useNavigate();

<button 
  onClick={() => navigate('/signup')}
  className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg font-semibold transition-colors"
>
  Get Started
</button>
```

### Form Validation Logic

**Email Validation**:
```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

**Password Validation**:
```javascript
const validatePassword = (password) => {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return password.length >= 8 && hasLetter && hasNumber;
};
```

**Password Match Validation**:
```javascript
const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword && password.length > 0;
};
```

### Form Field Structure

Each form field should follow this structure:
```javascript
<div className="mb-4">
  <label htmlFor="fieldName" className="block text-sm font-medium text-gray-700 mb-2">
    Field Label {!optional && <span className="text-red-500">*</span>}
  </label>
  <input
    type="text"
    id="fieldName"
    name="fieldName"
    value={formData.fieldName}
    onChange={(e) => handleInputChange('fieldName', e.target.value)}
    onBlur={() => validateField('fieldName', formData.fieldName)}
    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
      errors.fieldName ? 'border-red-500' : 'border-gray-300'
    }`}
  />
  {errors.fieldName && (
    <p className="mt-1 text-sm text-red-600">{errors.fieldName}</p>
  )}
</div>
```

### Role Selection UI

Use radio buttons for accessibility:
```javascript
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Role <span className="text-red-500">*</span>
  </label>
  <div className="flex gap-4">
    <label className="flex items-center">
      <input
        type="radio"
        name="role"
        value="customer"
        checked={formData.role === 'customer'}
        onChange={(e) => handleInputChange('role', e.target.value)}
        className="mr-2"
      />
      Customer
    </label>
    <label className="flex items-center">
      <input
        type="radio"
        name="role"
        value="provider"
        checked={formData.role === 'provider'}
        onChange={(e) => handleInputChange('role', e.target.value)}
        className="mr-2"
      />
      Provider
    </label>
  </div>
</div>
```

### OAuth Buttons (UI Only)

For the login page, create placeholder OAuth buttons:
```javascript
<div className="mt-6">
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">Or login with</span>
    </div>
  </div>
  
  <div className="mt-6 grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => handleOAuthLogin('google')}
      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
    >
      Google
    </button>
    <button
      type="button"
      onClick={() => handleOAuthLogin('facebook')}
      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
    >
      Facebook
    </button>
  </div>
</div>
```

### Password Security

- Use `type="password"` for password and confirmPassword inputs
- Do not log passwords to console
- Clear sensitive data from state after navigation
- Consider adding a "show/hide password" toggle icon

### Phone Number Field

- Use `type="tel"` for phone number input
- Mark as optional in the label
- No validation required if left empty
- Basic validation if value is provided (non-empty string)

### Form Submission

Since backend integration is separate, form submission should:
1. Validate all fields
2. If valid, show success message (console.log for now)
3. Prepare data in the format expected by future backend
4. Display appropriate feedback to user

```javascript
const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  setIsSubmitting(true);
  
  // Prepare data for future backend integration
  const submitData = {
    full_name: formData.fullName,
    email: formData.email,
    phone_number: formData.phoneNumber || null,
    password: formData.password,
    role: formData.role
  };
  
  console.log('Form submitted:', submitData);
  
  // TODO: Replace with actual API call when backend is ready
  // api.post('/auth/signup/', submitData)
  
  setIsSubmitting(false);
  alert('Signup successful! (Backend integration pending)');
};
