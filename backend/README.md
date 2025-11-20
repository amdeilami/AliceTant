# AliceTant Backend

Django REST API for the AliceTant booking system.

## Setup

1. Activate the virtual environment:
```bash
source .venv/bin/activate
```

2. Install dependencies (if needed):
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

## Running the Server

Start the development server on port 5174:
```bash
python manage.py runserver
```

The API will be available at: http://localhost:5174/api/

## API Endpoints

- `GET /api/health/` - Health check endpoint
