# Frontend (React + Vite)

Clean, modular React + Vite frontend starter configured for seamless communication with the FastAPI backend.

## Features
- **Vite** for fast HMR (Hot Module Replacement) and optimized bundling.
- **Modern Responsive Design System** in `src/index.css`.
- **Centralized API Service Layer** in `src/services/api.js`.
- **Live Health Diagnostics** & latency measurement with automatic polling.
- **Environment Configuration** via `.env` (`VITE_API_BASE_URL`).

## Directory Structure
```
frontend/
├── src/
│   ├── components/      # Reusable UI components (Header, StatusCard, QuickActions, etc.)
│   ├── pages/           # Page views (Dashboard, future hackathon pages)
│   ├── services/        # Centralized API service layer (api.js)
│   ├── App.jsx          # Root application component
│   ├── index.css        # Global design system & theme tokens
│   └── main.jsx         # Vite entrypoint
├── .env.example         # Environment template
├── .env                 # Local environment variables
├── package.json
└── vite.config.js
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Ensure `frontend/.env` contains your backend API URL:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch on [http://localhost:5173](http://localhost:5173).

### 4. Build for Production
```bash
npm run build
```
Build output will be generated in `dist/`.

## Communicating with Backend
Import the centralized API client from `src/services/api.js`:
```javascript
import api from '../services/api';

// Example: Fetch data
const response = await api.get('/api/items');
if (response.ok) {
  console.log(response.data);
} else {
  console.error(response.error);
}
```
