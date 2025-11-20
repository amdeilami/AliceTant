# AliceTant
A personal secretary to manage your schedule online; a booking interface for your customers.

## Quick Start

### Backend (Django)
```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```
Backend runs on: http://localhost:8000

### Frontend (React)
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

## Project Structure

- `backend/` - Django REST API
  - `AliceTant_Engine/` - Django project settings
  - `AliceTant/` - Main application
    - `models/` - Data models
    - `services/` - Business logic
    - `repositories/` - Database interface
    - `exceptions/` - Custom exceptions
- `frontend/` - React SPA
  - `src/components/` - Reusable components
  - `src/pages/` - Page components
  - `src/utils/` - Utilities and API client
