# AliceTant
A personal secretary to manage your schedule online; a booking interface for your customers.

## Quick Start

### Backend (Django)
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt  # if needed
python manage.py migrate
python manage.py runserver 5174
```
Backend runs on: http://localhost:5174

### Frontend (React)
```bash
cd frontend
npm install         # if needed
npx vite --force
```
Frontend runs on: http://localhost:5173

### Create an Admin User
```bash
cd backend
source .venv/bin/activate
python manage.py create_admin --email admin@example.com --password YourPassword123!
```
Omit `--email` and `--password` to be prompted interactively.

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
