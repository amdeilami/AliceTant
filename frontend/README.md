# AliceTant Frontend

React frontend for the AliceTant booking system.

## Setup

Install dependencies (already done):
```bash
npm install
```

## Running the Development Server

Start the Vite development server on port 5173:
```bash
npm run dev
```

The application will be available at: http://localhost:5173/

## Project Structure

- `src/components/` - Reusable React components
- `src/contexts/` - React context providers (Auth, Toast, Theme)
- `src/pages/` - Page components
- `src/utils/` - Utility functions and API client
- `src/App.jsx` - Main application with routing

## Dark/Light Theme

The app supports dark and light themes via `ThemeContext`.

- **Toggle:** A floating button (bottom-right corner) is available on every page, including public pages before login.
- **Persistence:** Theme preference is saved to `localStorage` and restored on reload.
- **System preference:** On first visit, the app respects `prefers-color-scheme`.
- **Implementation:** The `dark` class is toggled on `<html>`. Global CSS overrides in `src/index.css` remap Tailwind utility colors for dark mode without requiring `dark:` variants on every component.
