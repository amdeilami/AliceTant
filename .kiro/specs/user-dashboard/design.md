# User Dashboard Design Document

## Overview

The user dashboard system provides role-specific interfaces for customers and providers in the AliceTant application. After authentication, users are redirected to their respective dashboards based on their role. The dashboard serves as the central hub for managing appointments, profiles, and business operations.

The system implements a component-based architecture using React, with protected routes ensuring only authenticated users can access dashboard features. The design emphasizes responsive layouts, intuitive navigation, and clear separation between customer and provider workflows.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Login/     │────────▶│  Auth Check  │                 │
│  │   Signup     │         │  & Redirect  │                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                   │                          │
│                    ┌──────────────┴──────────────┐          │
│                    │                              │          │
│           ┌────────▼────────┐          ┌─────────▼────────┐ │
│           │  Customer        │          │  Provider        │ │
│           │  Dashboard       │          │  Dashboard       │ │
│           └────────┬────────┘          └─────────┬────────┘ │
│                    │                              │          │
│     ┌──────────────┼──────────────┐    ┌─────────┼────────┐ │
│     │              │              │    │         │        │ │
│  ┌──▼───┐   ┌─────▼─────┐  ┌────▼──┐ ┌▼────┐ ┌─▼──────┐ │ │
│  │Search│   │Appointment│  │Profile│ │Biz  │ │Avail.  │ │ │
│  │      │   │  History  │  │       │ │Mgmt │ │Mgmt    │ │ │
│  └──────┘   └───────────┘  └───────┘ └─────┘ └────────┘ │ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Django REST API                           │
├─────────────────────────────────────────────────────────────┤
│  /api/auth/me/          - Get current user                  │
│  /api/profile/          - Update profile                    │
│  /api/appointments/     - List/manage appointments          │
│  /api/businesses/       - CRUD businesses (provider)        │
│  /api/availability/     - Manage availability (provider)    │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── Router
    ├── PublicRoute (/, /login, /signup)
    ├── ProtectedRoute
        ├── CustomerDashboard
        │   ├── DashboardLayout
        │   │   ├── DashboardHeader
        │   │   ├── DashboardSidebar
        │   │   └── DashboardContent
        │   ├── SearchBar
        │   ├── AppointmentHistory
        │   └── ProfileSection
        │       ├── AvatarUpload
        │       ├── EmailUpdate
        │       └── PasswordUpdate
        └── ProviderDashboard
            ├── DashboardLayout
            │   ├── DashboardHeader
            │   ├── DashboardSidebar
            │   └── DashboardContent
            ├── BusinessManagement
            │   ├── BusinessList
            │   ├── BusinessForm
            │   └── BusinessCard
            ├── AvailabilityManagement
            │   ├── AvailabilityCalendar
            │   └── TimeSlotEditor
            ├── AppointmentManagement
            │   ├── AppointmentList
            │   └── AppointmentCard
            └── AppointmentHistory
```

## Components and Interfaces

### 1. Authentication & Routing Components

#### ProtectedRoute Component
```javascript
/**
 * Higher-order component that protects routes requiring authentication.
 * Redirects to login if user is not authenticated.
 * Redirects to role-specific dashboard based on user role.
 */
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'customer' | 'provider' | null;
}
```

#### useAuth Hook
```javascript
/**
 * Custom hook for managing authentication state.
 * Provides user data, authentication status, and auth methods.
 */
interface UseAuth {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}
```

### 2. Dashboard Layout Components

#### DashboardLayout Component
```javascript
/**
 * Main layout wrapper for dashboard pages.
 * Provides consistent header, sidebar, and content area.
 */
interface DashboardLayoutProps {
  children: ReactNode;
  role: 'customer' | 'provider';
}
```

#### DashboardSidebar Component
```javascript
/**
 * Navigation sidebar with role-specific menu items.
 * Collapsible on mobile devices.
 */
interface DashboardSidebarProps {
  role: 'customer' | 'provider';
  activeSection: string;
  onNavigate: (section: string) => void;
}
```

### 3. Customer Dashboard Components

#### SearchBar Component
```javascript
/**
 * Search input for finding providers and businesses.
 * Includes debounced search and autocomplete.
 */
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}
```

#### AppointmentHistory Component
```javascript
/**
 * Displays list of past and upcoming appointments.
 * Supports filtering and sorting.
 */
interface AppointmentHistoryProps {
  appointments: Appointment[];
  isLoading: boolean;
  onCancel?: (appointmentId: string) => void;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  providerName: string;
  businessName: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}
```

#### ProfileSection Component
```javascript
/**
 * User profile management with avatar, email, and password updates.
 */
interface ProfileSectionProps {
  user: User;
  onUpdate: (updates: ProfileUpdates) => Promise<void>;
}

interface ProfileUpdates {
  avatar?: File;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}
```

### 4. Provider Dashboard Components

#### BusinessManagement Component
```javascript
/**
 * Interface for creating and managing businesses.
 */
interface BusinessManagementProps {
  businesses: Business[];
  onCreateBusiness: (business: BusinessFormData) => Promise<void>;
  onUpdateBusiness: (id: string, business: BusinessFormData) => Promise<void>;
  onDeleteBusiness: (id: string) => Promise<void>;
}

interface Business {
  id: string;
  name: string;
  description: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  createdAt: string;
}

interface BusinessFormData {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
}
```

#### AvailabilityManagement Component
```javascript
/**
 * Interface for defining provider availability per business.
 */
interface AvailabilityManagementProps {
  businessId: string;
  availability: AvailabilitySlot[];
  onSaveAvailability: (slots: AvailabilitySlot[]) => Promise<void>;
}

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}
```

#### AppointmentManagement Component
```javascript
/**
 * Interface for viewing and managing appointments.
 */
interface AppointmentManagementProps {
  appointments: ProviderAppointment[];
  onCancelAppointment: (id: string) => Promise<void>;
}

interface ProviderAppointment {
  id: string;
  customerName: string;
  customerEmail: string;
  businessName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled' | 'completed';
}
```

## Data Models

### Frontend State Models

#### User Model
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'customer' | 'provider';
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
}
```

#### Customer Profile Model
```typescript
interface CustomerProfile extends User {
  fullName: string;
  phoneNumber?: string;
  preferences?: string;
}
```

#### Provider Profile Model
```typescript
interface ProviderProfile extends User {
  businessName: string;
  bio?: string;
  phoneNumber?: string;
  address?: string;
}
```

### API Request/Response Models

#### Profile Update Request
```typescript
interface ProfileUpdateRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: File; // Multipart form data
}
```

#### Password Update Request
```typescript
interface PasswordUpdateRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

#### Business Create/Update Request
```typescript
interface BusinessRequest {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
}
```

#### Availability Update Request
```typescript
interface AvailabilityRequest {
  businessId: string;
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 1.1 and 5.1 (role-based redirect) can be combined into a single property about role-based routing
- Properties 1.2 and 5.2 (role-specific UI) can be combined into a single property about role-based rendering
- Properties 1.3 and 5.3 (unauthenticated redirect) are identical and can be combined
- Properties 3.2 and 8.2 (displaying appointment fields) test the same rendering logic and can be combined
- Properties 3.4 and 8.4 (appointment sorting) test similar sorting logic and can be combined
- Properties 7.4 and 6.4 (displaying all items in a list) follow the same pattern and represent general list rendering

### Authentication and Routing Properties

Property 1: Role-based dashboard routing
*For any* authenticated user, the system should redirect them to the dashboard route corresponding to their role (customer → /dashboard/customer, provider → /dashboard/provider)
**Validates: Requirements 1.1, 5.1**

Property 2: Unauthenticated access protection
*For any* dashboard route, when accessed without a valid authentication token, the system should redirect to the login page
**Validates: Requirements 1.3, 5.3**

Property 3: Role-specific UI rendering
*For any* authenticated user viewing their dashboard, the system should display navigation and features specific to their role and exclude features for other roles
**Validates: Requirements 1.2, 5.2**

Property 4: User data fetching on dashboard load
*For any* authenticated user, when the dashboard renders, the system should fetch and display their current user data
**Validates: Requirements 1.4, 5.4**

### Search and Input Properties

Property 5: Search input acceptance
*For any* text string, the search bar should accept the input without throwing errors
**Validates: Requirements 2.2**

### Appointment Display Properties

Property 6: Appointment list rendering
*For any* user with appointments, navigating to the appointment section should display all their appointments
**Validates: Requirements 3.1, 8.1, 9.1**

Property 7: Appointment field completeness
*For any* appointment displayed in the UI, the rendered output should contain all required fields (date, time, provider/customer name, business name, status)
**Validates: Requirements 3.2, 8.2, 9.2**

Property 8: Appointment sorting
*For any* collection of appointments, the system should sort them chronologically with upcoming appointments before past appointments, and within each group, sorted by date
**Validates: Requirements 3.4, 8.4, 9.4**

### Profile Management Properties

Property 9: Profile data display
*For any* user navigating to the profile section, the system should display their current email and avatar
**Validates: Requirements 4.1**

Property 10: Image file validation
*For any* file uploaded as an avatar, the system should accept valid image formats (jpg, png, gif, webp) and reject non-image formats
**Validates: Requirements 4.2**

Property 11: Email format validation
*For any* email string submitted in profile updates, the system should validate it matches standard email format before accepting
**Validates: Requirements 4.3**

Property 12: Password confirmation requirement
*For any* password update attempt, the system should require both a new password and a matching confirmation password
**Validates: Requirements 4.4**

Property 13: Profile update reflection
*For any* successful profile update, the system should display a success message and immediately reflect the updated data in the UI
**Validates: Requirements 4.5**

### Business Management Properties

Property 14: Business creation with valid data
*For any* valid business data submitted through the business form, the system should create the business and display it in the provider's business list
**Validates: Requirements 6.2**

Property 15: Business validation error handling
*For any* invalid business data submitted, the system should display validation errors and prevent business creation
**Validates: Requirements 6.3**

Property 16: Complete business list display
*For any* provider with businesses, viewing the business list should display all businesses they have created
**Validates: Requirements 6.4**

### Availability Management Properties

Property 17: Availability management display
*For any* business selected by a provider, the system should display availability management options for that specific business
**Validates: Requirements 7.1**

Property 18: Availability input acceptance
*For any* availability slot, the system should accept specifications for day of week, start time, and end time
**Validates: Requirements 7.2**

Property 19: Time ordering validation
*For any* availability slot, the system should validate that the end time is after the start time before saving
**Validates: Requirements 7.3**

Property 20: Complete availability display
*For any* business with defined availability slots, viewing availability should display all slots for that business
**Validates: Requirements 7.4**

Property 21: Availability update persistence
*For any* availability update, the system should persist the changes to the backend and immediately reflect them in the UI
**Validates: Requirements 7.5**

### Appointment Management Properties

Property 22: Appointment cancellation status update
*For any* appointment cancelled by a provider, the system should update the appointment status to 'cancelled'
**Validates: Requirements 8.3**



## Error Handling

### Authentication Errors

**Token Expiration**
- When: Auth token expires during dashboard session
- Behavior: Redirect to login page with message "Your session has expired. Please log in again."
- Recovery: User logs in again and is redirected back to dashboard

**Invalid Token**
- When: Auth token is malformed or invalid
- Behavior: Clear local storage, redirect to login page
- Recovery: User logs in with valid credentials

**Role Mismatch**
- When: User attempts to access dashboard for different role
- Behavior: Redirect to correct dashboard for their role
- Recovery: Automatic redirect to appropriate dashboard

### API Errors

**Network Errors**
- When: API request fails due to network issues
- Behavior: Display error toast: "Unable to connect. Please check your internet connection."
- Recovery: Retry button allows user to attempt request again

**Server Errors (5xx)**
- When: Backend returns 500-level error
- Behavior: Display error message: "Something went wrong. Please try again later."
- Recovery: User can retry the action

**Validation Errors (400)**
- When: Backend rejects request due to validation failure
- Behavior: Display field-specific error messages inline with form
- Recovery: User corrects invalid fields and resubmits

**Not Found Errors (404)**
- When: Requested resource doesn't exist
- Behavior: Display message: "Resource not found" and redirect to dashboard home
- Recovery: User navigates to valid resource

**Unauthorized Errors (401)**
- When: Token is invalid or expired during API call
- Behavior: Clear auth state, redirect to login
- Recovery: User logs in again

### Form Validation Errors

**Client-Side Validation**
- Validate inputs before submission
- Display inline error messages immediately on blur
- Prevent form submission if validation fails
- Clear errors when user corrects input

**Common Validations:**
- Email: Must match email regex pattern
- Password: Minimum 8 characters, at least one letter and one number
- Phone: Optional, but if provided must match phone pattern
- Time: End time must be after start time
- File: Must be valid image format and under size limit (5MB)

### Empty States

**No Appointments**
- Display: "You don't have any appointments yet"
- Action: For customers, show search prompt; for providers, show availability setup prompt

**No Businesses**
- Display: "Create your first business to get started"
- Action: Button to open business creation form

**No Availability**
- Display: "Set your availability to start accepting appointments"
- Action: Button to open availability management

### Loading States

**Initial Page Load**
- Display: Skeleton screens for dashboard content
- Duration: Until API data is fetched

**Form Submission**
- Display: Loading spinner on submit button
- Behavior: Disable form inputs during submission
- Duration: Until API response received

**Data Refresh**
- Display: Subtle loading indicator (spinner in corner)
- Behavior: Don't block UI interaction
- Duration: Until refresh completes

## Testing Strategy

### Unit Testing

**Component Testing**
- Test each component in isolation using React Testing Library
- Mock API calls and external dependencies
- Verify correct rendering based on props
- Test user interactions (clicks, form inputs)
- Verify accessibility attributes

**Key Components to Test:**
- DashboardLayout: Renders correct layout for each role
- SearchBar: Accepts input and calls search callback
- AppointmentHistory: Displays appointments correctly
- ProfileSection: Handles form submission and validation
- BusinessManagement: CRUD operations work correctly
- AvailabilityManagement: Time validation works

**Hook Testing**
- Test useAuth hook with various auth states
- Test custom hooks for data fetching
- Verify state updates and side effects

**Utility Function Testing**
- Test validation functions (email, password, time)
- Test formatting functions (date, time display)
- Test sorting and filtering functions

### Property-Based Testing

Property-based tests will use **fast-check** library for JavaScript/React. Each test will run a minimum of 100 iterations with randomly generated inputs.

**Authentication Properties:**
- Property 1: Role-based routing (test with random user roles)
- Property 2: Unauthenticated redirect (test with various invalid tokens)
- Property 3: Role-specific UI (test with random user data)

**Data Display Properties:**
- Property 7: Appointment field completeness (test with random appointment data)
- Property 8: Appointment sorting (test with random appointment collections)
- Property 16: Business list completeness (test with random business collections)

**Validation Properties:**
- Property 10: Image validation (test with random file types)
- Property 11: Email validation (test with random email strings)
- Property 19: Time ordering (test with random time pairs)

**Form Properties:**
- Property 14: Business creation (test with random valid business data)
- Property 15: Validation errors (test with random invalid data)

### Integration Testing

**Route Protection**
- Test that unauthenticated users cannot access dashboard routes
- Test that users are redirected to correct dashboard based on role
- Test that navigation between dashboard sections works

**API Integration**
- Test that dashboard fetches user data on mount
- Test that profile updates call correct API endpoint
- Test that business CRUD operations work end-to-end
- Test that appointment data is fetched and displayed

**Form Workflows**
- Test complete profile update flow
- Test complete business creation flow
- Test complete availability setup flow
- Test error handling in forms

### Accessibility Testing

**Keyboard Navigation**
- All interactive elements accessible via keyboard
- Tab order is logical
- Focus indicators are visible

**Screen Reader Support**
- Proper ARIA labels on all interactive elements
- Form errors announced to screen readers
- Loading states announced
- Success/error messages announced

**Visual Accessibility**
- Color contrast meets WCAG AA standards
- Text is readable at various zoom levels
- Focus indicators are visible

### Responsive Testing

**Breakpoints to Test:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px and above

**Test Scenarios:**
- Dashboard layout adapts to screen size
- Navigation collapses to hamburger menu on mobile
- Tables become scrollable on small screens
- Forms remain usable on all screen sizes

## Implementation Notes

### State Management

Use React Context API for global state:
- AuthContext: User authentication state
- DashboardContext: Current dashboard section, loading states

Use local component state for:
- Form inputs
- UI toggles (sidebar open/closed)
- Temporary UI state

### API Integration

**Base API Configuration:**
```javascript
// Add auth token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### File Upload Handling

**Avatar Upload:**
- Client-side validation: Check file type and size before upload
- Use FormData for multipart/form-data requests
- Show preview before upload
- Display upload progress
- Handle upload errors gracefully

### Performance Considerations

**Code Splitting:**
- Lazy load dashboard routes
- Separate bundles for customer and provider dashboards

**Data Fetching:**
- Fetch only necessary data for current view
- Implement pagination for long lists
- Cache frequently accessed data

**Optimistic Updates:**
- Update UI immediately for better UX
- Revert on API error
- Show loading indicators for slow operations

### Security Considerations

**Token Storage:**
- Store auth token in localStorage
- Include token in Authorization header
- Clear token on logout

**Input Sanitization:**
- Sanitize all user inputs before display
- Prevent XSS attacks
- Validate file uploads

**Route Protection:**
- Check authentication on every route
- Verify user role matches required role
- Redirect unauthorized access attempts

### Accessibility Implementation

**Semantic HTML:**
- Use proper heading hierarchy
- Use semantic elements (nav, main, aside)
- Use button elements for clickable actions

**ARIA Attributes:**
- aria-label for icon buttons
- aria-describedby for form errors
- aria-live for dynamic content updates
- role attributes where needed

**Focus Management:**
- Trap focus in modals
- Return focus after modal close
- Skip links for keyboard users
- Visible focus indicators

### Responsive Design Strategy

**Mobile-First Approach:**
- Design for mobile first
- Add complexity for larger screens
- Use CSS Grid and Flexbox for layouts

**Breakpoint Strategy:**
```css
/* Mobile: default styles */

/* Tablet */
@media (min-width: 768px) {
  /* Tablet-specific styles */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Desktop-specific styles */
}
```

**Touch-Friendly:**
- Minimum touch target size: 44x44px
- Adequate spacing between interactive elements
- Swipe gestures for mobile navigation
