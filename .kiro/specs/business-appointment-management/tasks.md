# Implementation Plan

- [x] 1. Update Business model with summary and logo fields
  - [x] 1.1 Add summary field (CharField, max 512 chars, blank=True)
    - Update `backend/AliceTant/models/business.py`
    - Add summary field with proper validation
    - _Requirements: 1.3, 2.1_

  - [x] 1.2 Add logo field (ImageField, upload_to='business_logos/', blank=True, null=True)
    - Add logo ImageField to Business model
    - Configure upload path
    - _Requirements: 1.3, 2.3_

  - [x] 1.3 Create and run migration for Business model updates
    - Generate Django migration
    - Run migration to update database schema
    - _Requirements: 1.3_

  - [ ]* 1.4 Write property test for Business model
    - **Property 1: Business creation round trip**
    - **Property 3: Summary length validation**
    - **Property 5: Business update timestamp**
    - **Validates: Requirements 1.3, 2.1, 2.2, 1.5, 3.4**

- [x] 2. Create Appointment and AppointmentCustomer models
  - [x] 2.1 Create Appointment model
    - Create `backend/AliceTant/models/appointment.py`
    - Define AppointmentStatus choices (ACTIVE, CANCELLED)
    - Implement Appointment model with business FK, date, time, status, notes
    - Add unique constraint for (business, date, time) where status=ACTIVE
    - Add is_upcoming() method
    - _Requirements: 6.1, 6.2, 9.3, 10.1_

  - [x] 2.2 Create AppointmentCustomer through model
    - Define AppointmentCustomer model in same file
    - Add appointment and customer FKs
    - Add unique_together constraint
    - _Requirements: 6.3_

  - [x] 2.3 Update models __init__.py
    - Import Appointment and AppointmentCustomer in `backend/AliceTant/models/__init__.py`
    - _Requirements: 6.1_

  - [x] 2.4 Create and run migrations for Appointment models
    - Generate Django migrations
    - Run migrations to create tables
    - _Requirements: 6.1_

  <!-- - [ ]* 2.5 Write property test for Appointment model
    - **Property 7: Appointment creation with customers**
    - **Property 8: Time slot uniqueness**
    - **Property 9: Appointment cancellation preserves history**
    - **Property 10: Future date validation**
    - **Validates: Requirements 6.2, 6.3, 10.1, 10.2, 9.3, 10.3** -->

- [x] 3. Create custom exceptions for business and appointments
  - [x] 3.1 Add business and appointment exceptions
    - Update `backend/AliceTant/exceptions/user_exceptions.py` or create new file
    - Define BusinessNotFoundError, UnauthorizedAccessError, InvalidAppointmentDataError, TimeSlotConflictError
    - Add docstrings for each exception
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 4. Implement BusinessRepository
  - [x] 4.1 Create BusinessRepository with CRUD methods
    - Create `backend/AliceTant/repositories/business_repository.py`
    - Implement create_business() with logo handling
    - Implement get_business_by_id(), get_businesses_by_provider()
    - Implement get_all_businesses() with pagination
    - Implement search_businesses() by name/summary
    - Implement update_business() and delete_business()
    - Implement verify_ownership() helper
    - Add proper exception handling
    - _Requirements: 1.1, 1.3, 3.1, 4.1, 5.3_

  <!-- - [ ]* 4.2 Write property test for BusinessRepository
    - **Property 2: Provider ownership enforcement**
    - **Property 4: Logo file persistence**
    - **Property 6: Cascade delete for appointments**
    - **Validates: Requirements 1.2, 3.2, 3.3, 2.3, 2.4, 4.2** -->

  - [ ]* 4.3 Write unit tests for BusinessRepository
    - Test creating business with and without logo
    - Test ownership verification
    - Test search functionality
    - Test exception handling (BusinessNotFoundError)
    - _Requirements: 1.1, 3.2, 5.3, 11.1_

- [x] 5. Implement AppointmentRepository
  - [x] 5.1 Create AppointmentRepository with CRUD methods
    - Create `backend/AliceTant/repositories/appointment_repository.py`
    - Implement create_appointment() with transaction and customer linking
    - Implement get_appointment_by_id()
    - Implement get_appointments_by_business() with date filtering
    - Implement get_appointments_by_customer()
    - Implement get_appointments_by_provider()
    - Implement cancel_appointment() (soft delete)
    - Implement check_time_slot_available()
    - Add proper exception handling
    - _Requirements: 6.1, 6.2, 7.1, 8.1, 9.1, 10.1_

  - [ ]* 5.2 Write property test for AppointmentRepository
    - **Property 11: Provider appointment access**
    - **Property 12: Customer appointment access**
    - **Property 13: Appointment chronological ordering**
    - **Validates: Requirements 7.1, 8.1, 7.5, 8.4**

  - [ ]* 5.3 Write unit tests for AppointmentRepository
    - Test appointment creation with multiple customers
    - Test time slot conflict detection
    - Test cancellation behavior
    - Test date range filtering
    - _Requirements: 6.3, 10.1, 9.3, 7.4_

- [x] 6. Implement BusinessService
  - [x] 6.1 Create BusinessService with authorization
    - Create `backend/AliceTant/services/business_service.py`
    - Implement create_business_for_provider() with validation
    - Implement update_business_for_provider() with ownership check
    - Implement delete_business_for_provider() with ownership check
    - Implement get_provider_businesses()
    - Add summary length validation
    - _Requirements: 1.1, 3.1, 3.2, 4.1, 2.2_

  - [ ]* 6.2 Write property test for BusinessService
    - **Property 14: Authorization error handling**
    - **Validates: Requirements 3.2, 3.3, 4.4, 11.2**

- [x] 7. Implement AppointmentService
  - [x] 7.1 Create AppointmentService with validation
    - Create `backend/AliceTant/services/appointment_service.py`
    - Implement book_appointment() with conflict checking and future date validation
    - Implement cancel_appointment_by_customer() with authorization
    - Implement cancel_appointment_by_provider() with authorization
    - Implement get_customer_appointments() with upcoming/past grouping
    - Implement get_provider_appointments() with business filtering
    - _Requirements: 6.1, 9.1, 9.2, 8.1, 8.3, 7.1, 7.3, 10.3_

  - [ ]* 7.2 Write property test for AppointmentService
    - **Property 15: Time slot conflict detection**
    - **Validates: Requirements 10.1, 10.2, 11.4**

- [x] 8. Create Django REST Framework serializers
  - [x] 8.1 Update BusinessSerializer
    - Update `backend/AliceTant/serializers/business_serializers.py`
    - Add summary and logo fields
    - Add logo_url SerializerMethodField for URL generation
    - Add validate_summary() method for 512 char limit
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 8.2 Create AppointmentSerializer
    - Create `backend/AliceTant/serializers/appointment_serializers.py`
    - Define AppointmentSerializer with all fields
    - Add business_name and customer_names as read-only fields
    - Add is_upcoming SerializerMethodField
    - Add validation for future dates
    - _Requirements: 6.2, 7.2, 8.2_

  - [ ]* 8.3 Write unit tests for serializers
    - Test BusinessSerializer validation (summary length)
    - Test AppointmentSerializer validation (future dates)
    - Test serializer field output
    - _Requirements: 2.2, 10.3_

- [ ] 9. Update Business API views
  - [ ] 9.1 Update BusinessViewSet
    - Update `backend/AliceTant/views/business_views.py`
    - Update create() to handle logo upload and use BusinessService
    - Update update() to handle logo upload and ownership check
    - Update destroy() to check ownership
    - Add search/filter functionality
    - _Requirements: 1.1, 3.1, 4.1, 5.3, 12.1, 12.2_

  - [ ]* 9.2 Write unit tests for Business API views
    - Test business creation with logo
    - Test unauthorized update/delete attempts
    - Test search functionality
    - _Requirements: 3.2, 4.4, 5.3_

- [ ] 10. Create Appointment API views
  - [ ] 10.1 Create AppointmentViewSet
    - Create or update `backend/AliceTant/views/appointment_views.py`
    - Implement list() with filtering by user role (provider/customer)
    - Implement create() using AppointmentService
    - Implement cancel action for cancellation
    - Add filtering by business and date range
    - _Requirements: 6.1, 7.1, 7.3, 7.4, 8.1, 9.1, 9.2_

  - [ ]* 10.2 Write unit tests for Appointment API views
    - Test appointment creation
    - Test time slot conflict returns 409
    - Test cancellation by customer and provider
    - Test filtering
    - _Requirements: 6.1, 10.1, 9.1, 9.2, 7.3, 7.4_

- [ ] 11. Update URL routing
  - [ ] 11.1 Add appointment routes
    - Update `backend/AliceTant/urls.py`
    - Register AppointmentViewSet with router
    - Add cancel endpoint
    - _Requirements: 6.1, 9.1_

- [ ] 12. Configure Django media settings
  - [ ] 12.1 Update settings for file uploads
    - Update `backend/AliceTant_Engine/settings.py`
    - Configure MEDIA_ROOT and MEDIA_URL
    - Add Pillow to requirements.txt
    - Configure FILE_UPLOAD_MAX_MEMORY_SIZE
    - _Requirements: 2.3, 2.4_

  - [ ] 12.2 Update URL configuration for media files
    - Update `backend/AliceTant_Engine/urls.py`
    - Add static file serving for development
    - _Requirements: 2.4_

- [ ] 13. Checkpoint - Ensure backend tests pass
  - Ensure all backend tests pass, ask the user if questions arise.

- [ ] 14. Update BusinessManagement frontend component
  - [ ] 14.1 Update BusinessManagement component
    - Update `frontend/src/components/BusinessManagement.jsx`
    - Add business list display with logo thumbnails
    - Add create/edit/delete functionality
    - Add loading and error states
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ] 14.2 Update BusinessForm component
    - Update `frontend/src/components/BusinessForm.jsx`
    - Add summary field with character counter (512 max)
    - Add logo file input with preview
    - Add client-side validation
    - Handle FormData for multipart upload
    - Display inline validation errors
    - _Requirements: 2.1, 12.4, 12.5_

  - [ ]* 14.3 Write tests for Business components
    - Test BusinessForm validation and submission
    - Test logo upload and preview
    - Test error display
    - _Requirements: 12.5_

- [ ] 15. Create AppointmentBooking frontend component
  - [ ] 15.1 Create AppointmentBooking component
    - Create `frontend/src/components/AppointmentBooking.jsx`
    - Add business selection dropdown
    - Add date and time pickers
    - Add customer selection for group bookings
    - Add notes field
    - Add availability checking
    - Display booking confirmation
    - _Requirements: 6.1, 6.3_

  - [ ]* 15.2 Write tests for AppointmentBooking
    - Test form submission
    - Test validation
    - Test conflict error handling
    - _Requirements: 6.1, 10.1_

- [ ] 16. Update AppointmentHistory frontend component
  - [ ] 16.1 Update AppointmentHistory component
    - Update `frontend/src/components/AppointmentHistory.jsx`
    - Add tabs for upcoming/past appointments
    - Display business info, logo, date, time, customers
    - Add cancel button for upcoming appointments
    - Add business filter for providers
    - Implement responsive design
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 9.1, 9.2_

  - [ ]* 16.2 Write tests for AppointmentHistory
    - Test appointment display
    - Test filtering
    - Test cancellation
    - _Requirements: 7.3, 9.1_

- [ ] 17. Update API utility functions
  - [ ] 17.1 Add business and appointment API functions
    - Update `frontend/src/utils/api.js`
    - Add createBusiness(), updateBusiness(), deleteBusiness(), getBusinesses(), searchBusinesses()
    - Add createAppointment(), getAppointments(), cancelAppointment()
    - Handle FormData for file uploads
    - _Requirements: 1.1, 3.1, 4.1, 5.3, 6.1, 9.1_

- [ ] 18. Update dashboard pages
  - [ ] 18.1 Integrate BusinessManagement into ProviderDashboard
    - Update `frontend/src/pages/ProviderDashboard.jsx`
    - Add BusinessManagement component to dashboard
    - Add navigation/tabs for business management
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ] 18.2 Integrate AppointmentBooking into CustomerDashboard
    - Update `frontend/src/pages/CustomerDashboard.jsx`
    - Add AppointmentBooking component
    - Add business search/browse functionality
    - _Requirements: 5.3, 6.1_

  - [ ] 18.3 Update appointment views in both dashboards
    - Update both dashboard pages
    - Integrate u AppointmentHistory component
    - Add proper filtering for each role
    - _Requirements: 7.1, 8.1_

- [ ] 19. Add success/error notifications
  - [ ] 19.1 Add toast notifications for business operations
    - Use existing ToastContext
    - Add success messages for create/update/delete
    - Add error messages for validation failures
    - _Requirements: 12.6_

  - [ ] 19.2 Add toast notifications for appointment operations
    - Add success messages for booking/cancellation
    - Add error messages for conflicts and validation
    - _Requirements: 11.4_

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Run all backend and frontend tests
  - Verify all functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.
