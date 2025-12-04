# Implementation Plan

- [x] 1. Set up authentication context and protected routing
  - Create AuthContext with user state, authentication status, and auth methods
  - Implement useAuth custom hook for accessing auth context
  - Create ProtectedRoute component that checks authentication and redirects based on role
  - Update App.jsx to include protected routes for customer and provider dashboards
  - _Requirements: 1.1, 1.3, 5.1, 5.3_

- [ ]* 1.1 Write property test for role-based routing
  - **Property 1: Role-based dashboard routing**
  - **Validates: Requirements 1.1, 5.1**

- [ ]* 1.2 Write property test for unauthenticated access protection
  - **Property 2: Unauthenticated access protection**
  - **Validates: Requirements 1.3, 5.3**

- [x] 2. Create dashboard layout components
  - Implement DashboardLayout component with header, sidebar, and content area
  - Create DashboardHeader component with user info and logout button
  - Create DashboardSidebar component with role-specific navigation menu
  - Implement responsive behavior (collapsible sidebar on mobile)
  - Add navigation state management for active section highlighting
  - _Requirements: 1.2, 5.2_

- [ ]* 2.1 Write property test for role-specific UI rendering
  - **Property 3: Role-specific UI rendering**
  - **Validates: Requirements 1.2, 5.2**

- [x] 3. Implement customer dashboard structure
  - Create CustomerDashboard page component
  - Set up routing for customer dashboard sections (search, appointments, profile)
  - Implement section navigation within customer dashboard
  - Fetch and display customer user data on dashboard load
  - _Requirements: 1.1, 1.2, 1.4_

- [ ]* 3.1 Write property test for user data fetching
  - **Property 4: User data fetching on dashboard load**
  - **Validates: Requirements 1.4, 5.4**

- [x] 4. Build search functionality for customers
  - Create SearchBar component with text input and search icon
  - Implement debounced search to avoid excessive API calls
  - Add placeholder text and focus styling
  - Wire up search callback (search logic will be implemented in later tasks)
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 4.1 Write property test for search input acceptance
  - **Property 5: Search input acceptance**
  - **Validates: Requirements 2.2**

- [x] 5. Create appointment history for customers
  - Create AppointmentHistory component
  - Implement API endpoint call to fetch customer appointments
  - Display appointment list with date, time, provider name, business name, and status
  - Implement appointment sorting (upcoming first, then by date)
  - Add empty state message when no appointments exist
  - Style appointment cards with status indicators
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 5.1 Write property test for appointment list rendering
  - **Property 6: Appointment list rendering**
  - **Validates: Requirements 3.1, 8.1, 9.1**

- [ ]* 5.2 Write property test for appointment field completeness
  - **Property 7: Appointment field completeness**
  - **Validates: Requirements 3.2, 8.2, 9.2**

- [ ]* 5.3 Write property test for appointment sorting
  - **Property 8: Appointment sorting**
  - **Validates: Requirements 3.4, 8.4, 9.4**

- [x] 6. Implement customer profile management
  - Create ProfileSection component with tabs for avatar, email, and password
  - Implement avatar upload with preview and file validation
  - Create email update form with validation
  - Create password update form with current password, new password, and confirmation
  - Add API calls for profile updates
  - Display success/error messages after updates
  - Update displayed user data after successful changes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 6.1 Write property test for profile data display
  - **Property 9: Profile data display**
  - **Validates: Requirements 4.1**

- [ ]* 6.2 Write property test for image file validation
  - **Property 10: Image file validation**
  - **Validates: Requirements 4.2**

- [ ]* 6.3 Write property test for email format validation
  - **Property 11: Email format validation**
  - **Validates: Requirements 4.3**

- [ ]* 6.4 Write property test for password confirmation requirement
  - **Property 12: Password confirmation requirement**
  - **Validates: Requirements 4.4**

- [ ]* 6.5 Write property test for profile update reflection
  - **Property 13: Profile update reflection**
  - **Validates: Requirements 4.5**

- [x] 7. Checkpoint - Ensure all tests pass for customer dashboard
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement provider dashboard structure
  - Create ProviderDashboard page component
  - Set up routing for provider dashboard sections (businesses, availability, appointments, history)
  - Implement section navigation within provider dashboard
  - Fetch and display provider user data and businesses on dashboard load
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 9. Build business management for providers
  - Create BusinessManagement component with business list view
  - Create BusinessForm component for creating/editing businesses
  - Implement business creation with validation (name, description, contact info)
  - Add API calls for business CRUD operations
  - Display all provider's businesses in a grid/list
  - Add empty state prompt when no businesses exist
  - Implement business edit and delete functionality
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 9.1 Write property test for business creation with valid data
  - **Property 14: Business creation with valid data**
  - **Validates: Requirements 6.2**

- [ ]* 9.2 Write property test for business validation error handling
  - **Property 15: Business validation error handling**
  - **Validates: Requirements 6.3**

- [ ]* 9.3 Write property test for complete business list display
  - **Property 16: Complete business list display**
  - **Validates: Requirements 6.4**

- [x] 10. Create availability management for providers
  - Create AvailabilityManagement component
  - Implement business selector to choose which business to manage
  - Create TimeSlotEditor for adding/editing availability slots
  - Add day of week selector, start time, and end time inputs
  - Implement time validation (end time must be after start time)
  - Display all availability slots for selected business
  - Add API calls to save and fetch availability
  - Show immediate UI updates after saving availability
  - Add empty state when no availability is defined
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 10.1 Write property test for availability management display
  - **Property 17: Availability management display**
  - **Validates: Requirements 7.1**

- [ ]* 10.2 Write property test for availability input acceptance
  - **Property 18: Availability input acceptance**
  - **Validates: Requirements 7.2**

- [ ]* 10.3 Write property test for time ordering validation
  - **Property 19: Time ordering validation**
  - **Validates: Requirements 7.3**

- [ ]* 10.4 Write property test for complete availability display
  - **Property 20: Complete availability display**
  - **Validates: Requirements 7.4**

- [ ]* 10.5 Write property test for availability update persistence
  - **Property 21: Availability update persistence**
  - **Validates: Requirements 7.5**

- [x] 11. Implement appointment management for providers
  - Create AppointmentManagement component
  - Fetch and display all appointments across provider's businesses
  - Show customer name, email, business name, date, time, and status
  - Implement appointment sorting (upcoming first, chronologically)
  - Add cancel appointment functionality with confirmation dialog
  - Update appointment status after cancellation
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 11.1 Write property test for appointment cancellation status update
  - **Property 22: Appointment cancellation status update**
  - **Validates: Requirements 8.3**

- [x] 12. Create appointment history for providers
  - Create AppointmentHistory component for providers
  - Fetch and display past appointments
  - Show customer name, date, time, and business name
  - Implement sorting by date in descending order (newest first)
  - Add empty state message when no past appointments exist
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 13. Implement responsive design
  - Add responsive breakpoints for mobile, tablet, and desktop
  - Make sidebar collapsible on mobile with hamburger menu
  - Ensure forms are usable on small screens
  - Make tables/lists scrollable on mobile
  - Test all dashboard sections on different screen sizes
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 14. Add error handling and loading states
  - Implement global error boundary for React errors
  - Add loading skeletons for initial dashboard load
  - Add loading spinners for form submissions
  - Implement error toasts for API failures
  - Add retry functionality for failed requests
  - Handle token expiration with redirect to login
  - Display validation errors inline with forms
  - _Requirements: All requirements (error handling is cross-cutting)_

- [x] 15. Implement accessibility features
  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works throughout dashboard
  - Add focus indicators for all focusable elements
  - Implement focus trapping in modals
  - Add screen reader announcements for dynamic content
  - Test with screen reader (NVDA or VoiceOver)
  - Verify color contrast meets WCAG AA standards
  - _Requirements: All requirements (accessibility is cross-cutting)_

- [ ]* 15.1 Write unit tests for accessibility
  - Test keyboard navigation
  - Test ARIA attributes
  - Test focus management

<!-- - [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise. -->
