---
inclusion: always
----

# Technology Stack

(most of the requirements are already installed on this machine)

## 1. Architecture Overview

AliceTant is a web application with:

- A **React**-based frontend (SPA) for providers and customers.
- A **Django** backend exposing a JSON API.
- A **relational database** (SQLite initially) for persistent storage.

The system is designed with **strong consistency** as the primary concern, ensuring that an appointment time slot cannot be double-booked.


## 2. Frontend

**Framework & Language**

- **React** (JavaScript)
- **React Router** for client-side routing (e.g., `/login`, `/dashboard`, `/schedule`)

**Styling**

- **Tailwind CSS** for utility-first styling and rapid UI iteration

**Build Tooling**

- **Vite** (or Create React App) for:
  - Development server with hot module replacement
  - Production bundling and asset optimization

## 3. Backend

**Web Framework**

- **Django**

**API Layer**

- **Django REST Framework (DRF)** (planned)
  - Expose RESTful endpoints for:
    - User registration & authentication
    - Provider availability management
    - Appointment slot creation/update/cancellation
    - Booking and cancelling appointments

## 4. Testing
- **Vitest + React Testing Library** for frontend unit/integration tests
- **Django Test Framework / pytest** for backend unit/integration tests