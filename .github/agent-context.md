---
project: AliceTant
type: agent-context
description: >
  Foundational context for AI agents working on the AliceTant codebase.
  Two-sided booking/scheduling web app — providers create businesses and
  manage availability; customers search and book appointments; admins
  oversee users, businesses, appointments, analytics, settings, and backups.
roles:
  - PROVIDER: Creates businesses, defines availability, manages appointments
  - CUSTOMER: Searches businesses, books appointments
  - ADMIN: Platform oversight — user/business moderation, analytics, settings, backups (CLI-created only)
---

# AliceTant — Agent Context

## Tech Stack

```yaml
backend:
  framework: Django 5.2.8 + DRF 3.16.1
  runtime: Python 3.14
  venv: backend/.venv
  database: SQLite (backend/db.sqlite3)
  auth: JWT via PyJWT 2.8 — custom JWTAuthentication in auth_views.py, token in localStorage as authToken
  imaging: Pillow 10.4 (macOS ARM needs LDFLAGS/CPPFLAGS for jpeg)
  testing: unittest + hypothesis 6.92

frontend:
  framework: React 19.2 (functional components + hooks)
  bundler: Vite 7.2
  css: Tailwind CSS v4 (CSS-first via @tailwindcss/postcss, no tailwind.config.js)
  http: Axios 1.13
  routing: react-router-dom 7.9
  charts: Recharts 3.8 (admin analytics only)
  dark_mode: class-based (html.dark, managed by ThemeContext)
  testing: vitest + React Testing Library
```

## Architecture

### Backend — `View → Service → Repository → Model`

```yaml
views:       # Handle HTTP + serializer validation. Never call ORM directly.
services:    # Business rules, authorization, orchestration.
repositories: # Only layer that touches ORM. Translates Django → domain exceptions.
models:      # Plain Django models.
serializers: # Input validation and response shaping.
exceptions:  # Domain exceptions in user_exceptions.py, *Error naming.
permissions: # IsAdmin permission class in permissions.py.
signals:     # post_migrate seed for default SystemSettings.
```

**Exception:** availability views handle slot creation directly (bulk/recurring logic).

### Frontend — `Pages → Components → Contexts → API`

```yaml
pages:
  - Home, Login, Signup
  - CustomerDashboard, ProviderDashboard, AdminDashboard
  - BusinessPage

components:
  core: Layout, DashboardLayout, DashboardHeader, DashboardSidebar, ProtectedRoute, ErrorBoundary, AnnouncementBanner
  features: BusinessForm, BusinessManagement, AvailabilityManagement, AppointmentManagement, WorkingHoursEditor, ClosuresEditor, ProfileSection
  admin: AdminUserManagement, AdminBusinessManagement, AdminAppointmentManagement, AdminAnalyticsDashboard, AdminSettingsView, AdminBackupView, AdminExportView, AuditLogView, LoginHistoryModal, AdminActionModal, AdminPaginationControls

contexts:
  - AuthContext (auth state, mustChangePassword, isSuspended)
  - ToastContext (notifications)
  - ThemeContext (dark/light mode)

hooks:
  - useAnnouncement (polls /api/announcement/ on load + every 5 min)

utils:
  - api.js (Axios, base URL http://localhost:5174/api, auto-injects Bearer token)
  - formatId.js (reference ID display with privacy masking)
```

## How to Run

```yaml
backend:
  start: |
    cd backend
    source .venv/bin/activate
    pip install -r requirements.txt  # if needed
    python manage.py migrate
    python manage.py runserver 5174  # http://localhost:5174
  test: |
    cd backend && source .venv/bin/activate
    python manage.py test AliceTant
  create_admin: |
    cd backend && source .venv/bin/activate
    python manage.py create_admin

frontend:
  start: |
    cd frontend
    npm install         # if needed
    npx vite --force    # http://localhost:5173
  test: |
    cd frontend && npm test
```

## API Endpoints

All prefixed with `/api/`.

```yaml
public:
  - POST /auth/signup/
  - POST /auth/login/
  - GET  /auth/me/
  - GET  /announcement/
  - GET  /health/

customer_provider:
  - /businesses/              # CRUD ViewSet
  - /appointments/            # CRUD ViewSet (includes reschedule)
  - /availability/            # GET, POST, PUT, DELETE
  - /working-hours/           # GET, POST (closures nested)
  - PUT /profile/email/
  - PUT /profile/password/
  - PUT /profile/avatar/

admin:  # all require IsAdmin permission
  - /admin/users/                          # list, suspend, reactivate, force-password-reset, login-history
  - /admin/businesses/                     # list, hide, unhide
  - /admin/appointments/                   # list, force-cancel
  - /admin/analytics/users/                # user growth
  - /admin/analytics/bookings/             # booking trends, heatmap
  - /admin/analytics/cancellations/        # cancellation/modification rates
  - /admin/analytics/businesses/popularity/ # top/bottom businesses
  - /admin/settings/                       # list, update system settings
  - /admin/audit-log/                      # paginated audit trail
  - /admin/backups/                        # create, list, download, restore, delete
  - /admin/export/users.csv
  - /admin/export/businesses.csv
  - /admin/export/appointments.csv
```

## Data Models

```yaml
User:
  extends: AbstractUser
  fields: [role (PROVIDER/CUSTOMER/ADMIN), email (unique), reference_id, is_suspended, suspended_at, suspension_reason, must_change_password, created_at, updated_at]

Provider:
  relation: OneToOne with User (PK = user)
  fields: [business_name, bio (4096), phone_number, address]

Customer:
  relation: OneToOne with User (PK = user)
  fields: [full_name, phone_number, preferences]

Business:
  relation: FK to Provider
  fields: [name, summary (4096), logo (ImageField), phone, email, address, reference_id, is_hidden, hidden_reason, timestamps]
  ordering: [-created_at]

Availability:
  relation: FK to Business
  fields: [date, day_of_week (auto from date, 0=Sun..6=Sat), start_time, end_time, capacity (null=1), recurring_group (UUID), timestamps]
  unique: [business, date, start_time]
  notes: Recurring creation expands into per-date records sharing a recurring_group UUID. Overlapping dates are skipped.

Appointment:
  relation: FK to Business, M2M with Customer via AppointmentCustomer
  fields: [appointment_date, appointment_time, end_time, availability (FK SET_NULL), status (ACTIVE/CANCELLED/PENDING_MOD), reference_id, notes, timestamps]
  notes: Booking validates against availability capacity.

PendingModification:
  relation: FK to Appointment
  fields: [proposed_by, proposed_by_user_id, new_date, new_time, new_end_time, new_notes, status, created_at, resolved_at]

WorkingHours:
  relation: FK to Business
  fields: [day_of_week, open_time, close_time, is_closed]
  unique: [business, day_of_week]

BusinessClosure:
  relation: FK to Business
  fields: [title, start_date, end_date, reason]
  notes: Auto-cancels active appointments within closure range on save.

AuditLog:
  fields: [actor (FK User), action, target_type, target_id, details (JSON), ip_address, user_agent, created_at]

LoginEvent:
  fields: [user (FK), success, ip_address, user_agent, created_at]

SystemSetting:
  fields: [key (unique), value, value_type (string/int/bool/json), description, updated_at, updated_by (FK SET_NULL)]
  defaults: max_appointment_duration_minutes (480), max_recurring_weeks (64), max_bookings_per_customer_per_day (10), announcement_banner_text, announcement_banner_visible, announcement_banner_severity
```

## Coding Standards

```yaml
do:
  - Write minimal, correct code — no speculative abstractions
  - Follow layered architecture — views never call ORM; repositories never contain business logic
  - Use flat code with early returns over nested if/else
  - Use functional components + hooks on frontend
  - Use AuthContext for auth, api.js util for HTTP
  - Put new exceptions in user_exceptions.py with *Error naming
  - Use makemigrations to create new migrations

do_not:
  - Add docstrings/comments/type annotations to unchanged code
  - Add error handling for impossible scenarios
  - Rename or restructure files without being asked
  - Add packages/dependencies without being asked
  - Modify migration files by hand
  - Commit db.sqlite3 or .venv/
```