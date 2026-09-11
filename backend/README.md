# Backend (FastAPI + SQLAlchemy + Supabase)

Production-ready, modular FastAPI starter designed for rapid hackathon feature development with Supabase PostgreSQL.

## Features
- **FastAPI** with auto-generated Swagger OpenAPI docs (`/docs`) and ReDoc (`/redoc`).
- **Pydantic v2 & Pydantic Settings** for environment variable management (`.env`).
- **SQLAlchemy 2.0** database layer connecting to Supabase PostgreSQL (or local fallback).
- **Safe Health Diagnostics**: `/api/health` reports connection latency and status without leaking secrets.
- **CORS Configured** out of the box for frontend communication.
- **Clean Architecture**: Separated `models`, `schemas`, `routes`, `services`, `database`, and `core`.

## Directory Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # Application entrypoint & middleware configuration
│   ├── core/            # App settings, environment configs & safe URL masking
│   ├── database/        # Engine, Base, Session generator (get_db), & health test
│   ├── models/          # SQLAlchemy ORM models (empty, ready for hackathon)
│   ├── schemas/         # Pydantic validation schemas
│   ├── routes/          # API route handlers (/api/...)
│   └── services/        # Reusable business logic
├── requirements.txt     # Python dependencies
└── README.md
```

## Quick Start

### 1. Environment Variables
Create a `.env` in the root:
```env
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Supabase PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### 2. Run the Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **Root**: [http://localhost:8000/](http://localhost:8000/)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
