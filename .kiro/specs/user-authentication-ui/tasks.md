# Implementation Plan

- [x] 1. Create Signup page component with form structure
  - Create `/frontend/src/pages/Signup.jsx` file
  - Set up component with Layout wrapper
  - Implement form state management (formData, errors, isSubmitting)
  - Create form structure with all required fields (fullName, email, phoneNumber, password, confirmPassword, role)
  - Add navigation link to login page with text "Already have an account? Login here"
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2_

- [x] 2. Implement client-side validation for Signup form
  - Create validation functions for email, password, fullName, and password match
  - Implement `validateField()` method for individual field validation
  - Implement `validateForm()` method for complete form validation
  - Add validation on blur for each field
  - Display inline error messages below each field
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 2.1 Write property test for email validation
  - **Property 1: Email validation follows standard format**
  - **Validates: Requirements 3.1**

- [ ]* 2.2 Write property test for password validation
  - **Property 2: Password validation enforces security requirements**
  - **Validates: Requirements 3.3**

- [ ]* 2.3 Write property test for password confirmation
  - **Property 3: Password confirmation must match**
  - **Validates: Requirements 3.4**

- [ ]* 2.4 Write property test for required field validation
  - **Property 4: Required field validation**
  - **Validates: Requirements 3.2**

- [x] 3. Create Login page component with form structure
  - Create `/frontend/src/pages/Login.jsx` file
  - Set up component with Layout wrapper
  - Implement form state management (formData, errors, isSubmitting)
  - Create form structure with email and password fields
  - Add OAuth buttons for Google and Facebook (UI only)
  - Add navigation link to signup page with text "Don't have an account? Sign up here"
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3_

- [x] 4. Implement client-side validation for Login form
  - Create validation functions for email and password (required check)
  - Implement `validateField()` method for individual field validation
  - Implement `validateForm()` method for complete form validation
  - Add validation on blur for each field
  - Display inline error messages below each field
  - _Requirements: 6.4, 6.5, 6.6_

- [ ]* 4.1 Write unit tests for Login form validation
  - Test email validation with valid and invalid formats
  - Test required field validation for email and password
  - Test form submission prevention when validation fails
  - _Requirements: 6.4, 6.6_

- [x] 5. Add routing configuration
  - Update `/frontend/src/App.jsx` to add `/signup` and `/login` routes
  - Import Signup and Login components
  - Test navigation between pages
  - _Requirements: 1.1, 1.2, 4.3, 5.3_

- [ ]* 5.1 Write property test for navigation data isolation
  - **Property 7: Navigation between signup and login preserves no form data**
  - **Validates: Requirements 4.3, 5.3**

- [x] 6. Update Homepage to link to Signup page
  - Update "Get Started" button in `/frontend/src/pages/Home.jsx` to navigate to `/signup`
  - Import and use `useNavigate` from react-router-dom
  - Test navigation from homepage to signup
  - _Requirements: 1.1_

- [x] 7. Style forms with Tailwind CSS
  - Apply consistent styling to all form fields
  - Implement error states (red borders and text)
  - Add focus states with indigo ring
  - Style submit buttons with hover and disabled states
  - Ensure responsive design for mobile, tablet, and desktop
  - Add proper spacing and card layout
  - _Requirements: 1.3_

- [ ]* 7.1 Write property test for role selection
  - **Property 6: Role selection maintains exactly one choice**
  - **Validates: Requirements 2.6**

- [ ]* 7.2 Write unit tests for component rendering
  - Test that all signup form fields render correctly
  - Test that all login form fields render correctly
  - Test that role selector renders with both options
  - Test that navigation links render with correct text
  - Test that OAuth buttons render on login page
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 5.1, 5.2, 5.4, 6.1, 6.2, 6.3_

- [x] 8. Implement form submission handlers
  - Create `handleSubmit()` for Signup form (validation + console.log)
  - Create `handleSubmit()` for Login form (validation + console.log)
  - Create `handleOAuthLogin()` for OAuth buttons (console.log)
  - Add loading state during submission
  - Display success/error feedback to user
  - _Requirements: 3.2, 5.4, 6.5_

- [ ]* 8.1 Write unit tests for form submission
  - Test form submission with valid data
  - Test form submission prevention with invalid data
  - Test loading state during submission
  - Test OAuth button click handlers
  - _Requirements: 6.5_

- [x] 9. Add accessibility features
  - Ensure all inputs have proper labels and ARIA attributes
  - Add proper input types (email, password, tel)
  - Ensure keyboard navigation works correctly
  - Add aria-live regions for error announcements
  - Test tab order through forms
  - _Requirements: 1.3_

- [ ]* 9.1 Write unit tests for accessibility
  - Test that all form inputs are keyboard accessible
  - Test that ARIA labels exist on form elements
  - Test focus indicators on interactive elements
  - _Requirements: 1.3_

- [x] 10. Final testing and polish
  - Test complete user flows (home → signup, signup → login, login → signup)
  - Verify all validation rules work correctly
  - Test responsive design on different screen sizes
  - Ensure error messages are clear and helpful
  - Verify no console errors or warnings
  - _Requirements: All_
