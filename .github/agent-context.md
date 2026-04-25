# AliceTant — Agent Context

## What Is This Project

AliceTant is a two-sided booking/scheduling web application. **Providers** create businesses, define availability windows, set working hours, and manage appointments. **Customers** search for businesses and book appointments within available time slots.

---

## Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Backend framework | Django + DRF | 5.2.8 / 3.16.1 | |
| Backend runtime | Python | 3.14 | venv at `backend/.venv` |
| Frontend framework | React | 19.2 | Functional components + hooks |
| Frontend bundler | Vite | 7.2 | |
| CSS | Tailwind CSS | v4 | CSS-first config via `@tailwindcss/postcss` (no tailwind.config.js) |
| HTTP client | Axios | 1.13 | |
| Routing | react-router-dom | 7.9 | |
| Database | SQLite | — | File at `backend/db.sqlite3` |
| Auth | JWT (PyJWT) | 2.8 | Custom `JWTAuthentication` class in `auth_views.py`, tokens stored in `localStorage` as `authToken` |
| Image handling | Pillow | 10.4 | Requires `LDFLAGS="-L/opt/homebrew/opt/jpeg/lib"` and `CPPFLAGS="-I/opt/homebrew/opt/jpeg/include"` to build on macOS ARM |
| Testing (backend) | unittest + hypothesis | 6.92 | Property-based + unit tests |
| Testing (frontend) | vitest + React Testing Library | — | |
| Dark mode | Class-based | — | `html.dark` class, managed by `ThemeContext` |

---

## Architecture

### Backend: `View → Service → Repository → Model`

- **Views** (`AliceTant/views/`): Handle HTTP, use serializers for validation, return responses. **Never call ORM directly** (exception: availability views handle slot creation directly due to bulk/recurring logic).
- **Services** (`AliceTant/services/`): Business rules, authorization, orchestration.
- **Repositories** (`AliceTant/repositories/`): Only layer that touches the ORM. Translates Django exceptions into domain exceptions.
- **Models** (`AliceTant/models/`): Plain Django models.
- **Serializers** (`AliceTant/serializers/`): Input validation and response shaping.
- **Exceptions** (`AliceTant/exceptions/user_exceptions.py`): Domain exceptions following `*Error` naming.

### Frontend: `Pages → Components → Contexts → API`

- **Pages** (`src/pages/`): `Home`, `Login`, `Signup`, `CustomerDashboard`, `ProviderDashboard`
- **Components** (`src/components/`): Reusable UI — business forms, availability/appointment management, working hours/closures editors, dashboard layout, error handling, etc.
- **Contexts** (`src/contexts/`): `AuthContext` (auth state), `ToastContext` (notifications), `ThemeContext` (dark mode)
- **API client** (`src/utils/api.js`): Axios instance, base URL `http://localhost:5174/api`, auto-injects Bearer token

---

## How to Run

### Backend

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt    # if needed
python manage.py migrate
python manage.py runserver 5174    # http://localhost:5174
```

### Frontend

```bash
cd frontend
npm install                         # if needed
npx vite --force                    # http://localhost:5173 (--force clears dep cache)
```

### Tests

```bash
# Backend
cd backend && source .venv/bin/activate && python manage.py test AliceTant

# Frontend
cd frontend && npm test
```

---

## API Endpoints

All under `/api/`:

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/signup/`, `POST /auth/login/`, `GET /auth/me/` |
| Businesses | `/businesses/` (CRUD via DRF ViewSet) |
| Appointments | `/appointments/` (CRUD via DRF ViewSet, includes reschedule action) |
| Availability | `GET/POST /availability/`, `GET/PUT/DELETE /availability/<id>/` |
| Working Hours | `GET/POST /working-hours/`, closures nested |
| Profile | `PUT /profile/email/`, `PUT /profile/password/`, `PUT /profile/avatar/` |

---

## Data Models

### User
Extends `AbstractUser`. Fields: `role` (PROVIDER/CUSTOMER), `email` (unique), `created_at`, `updated_at`.

### Provider
One-to-one with User (PK = user). Fields: `business_name`, `bio` (4096), `phone_number`, `address`.

### Customer
One-to-one with User (PK = user). Fields: `full_name`, `phone_number`, `preferences`.

### Business
FK to Provider. Fields: `name`, `summary` (TextField, max 4096 chars), `logo` (ImageField), `phone`, `email`, `address`, timestamps. Ordering: `-created_at`.

### Availability
FK to Business. **Date-specific** time windows for booking. Fields: `date` (DateField), `day_of_week` (auto-derived from date, 0=Sun..6=Sat), `start_time`, `end_time`, `capacity` (nullable, NULL=1 concurrent booking), `recurring_group` (UUID, groups weekly-recurring slots), timestamps. Unique: `(business, date, start_time)`. Ordering: `[date, start_time]`.

**Recurring creation:** When creating, user can toggle "Repeat weekly" for 1–64 weeks. Backend expands into individual per-date records sharing a `recurring_group` UUID. Overlapping dates are skipped (partial success).

### Appointment
FK to Business. M2M with Customer via `AppointmentCustomer`. Fields: `appointment_date`, `appointment_time` (start), `end_time` (nullable), `availability` (FK, SET_NULL), `status` (ACTIVE/CANCELLED), `notes`, timestamps. Booking validates against availability capacity (overlapping time range count vs capacity).

### WorkingHours
FK to Business. Fields: `day_of_week`, `open_time`, `close_time`, `is_closed`. Unique: `(business, day_of_week)`.

### BusinessClosure
FK to Business. Fields: `title`, `start_date`, `end_date`, `reason`. Auto-cancels active appointments within closure range on save.

---

## Coding Standards

- Write minimal, correct code. No speculative abstractions.
- Do **not** add docstrings/comments/type annotations to unchanged code.
- Do **not** add error handling for impossible scenarios.
- Follow the layered architecture. Views don't call ORM; repositories don't contain business logic.
- Frontend: functional components + hooks, `AuthContext` for auth, `api` util for HTTP.
- New exceptions go in `user_exceptions.py` with `*Error` naming.
- Serializers handle validation and response shaping only.
- Prefer flat code with early returns over nested if/else.
- Add tests when adding features or fixing bugs.

### Do Not

- Rename/restructure files without being asked.
- Add packages/dependencies without being asked.
- Modify migration files by hand — use `makemigrations`.
- Commit `db.sqlite3` or `.venv/`.