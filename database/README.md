# Database Infrastructure (Supabase-First + PostgreSQL Fallback)

This directory houses database initialization scripts, schemas, and migration resources.

## Overview
- **Primary Database**: Supabase PostgreSQL 16
- **Local Fallback**: Docker PostgreSQL container (`docker-compose.yml`) or native local service
- **ORM / Query Builder**: SQLAlchemy 2.0
- **Connection pooling**: Managed in `backend/app/database/session.py`

## Configuring Supabase (Primary)

1. Obtain your connection string from your Supabase Dashboard:
   `Project Settings -> Database -> Connection string (URI)`
2. Add it to `.env` in the root:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
3. Test connectivity with:
   ```powershell
   .\scripts\test_db.ps1
   ```

## Local Docker PostgreSQL (Optional Fallback)

If developing offline or without a cloud database:
```bash
docker compose up -d postgres
```
And set your `.env` to:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```
This mounts `database/init.sql` to enable extensions (`uuid-ossp`, `pgcrypto`) automatically.

## Managing Schemas Tomorrow

When problem statement tables are created tomorrow:
```python
# In backend/app/main.py or seed script:
from app.database.base import Base
from app.database.session import engine
import app.models  # imports all models

Base.metadata.create_all(bind=engine)
```
