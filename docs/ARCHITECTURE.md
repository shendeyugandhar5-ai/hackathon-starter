# LearnOS — System Architecture & Extension Guide

> **Master Architecture Document**: See the complete, unified technical specification in [`docs/LEARNOS_COMPLETE_ARCHITECTURE.md`](file:///c:/Users/shend/OneDrive/Desktop/hackthon/hackathon-starter/docs/LEARNOS_COMPLETE_ARCHITECTURE.md).

## Overview

**LearnOS** is an Agentic Placement-Prep Mentorship & Adaptive Learning System. It employs a **3-Tier AI/ML Hybrid Architecture**:
1. **Tier 1 (Classical ML)**: TF-IDF + Logistic Regression for $<5\text{ms}$ subject intent routing across DSA, DBMS, Maths, AIML, and General.
2. **Tier 2 (Deep Learning & Statistics)**: PyTorch DKT-LSTM Knowledge Tracing + Bayesian Knowledge Tracing (BKT) Progress Engine + Continuous Confusion Detection.
3. **Tier 3 (Multi-Agent GenAI)**: Specialized Subject LLM Agents (DSA, DBMS, Maths, AIML, General leaf node) + Cross-Agent Collaboration + Verifier Guardrail Agent.


---

## Architectural Principles

1. **Separation of Concerns**:
   - **Routes**: Handle HTTP concerns (validation, query params, status codes, response wrapping).
   - **Schemas (Pydantic)**: Data contracts for incoming payloads and outgoing responses.
   - **Services**: Business logic, algorithms, external API integrations, computation.
   - **Models (SQLAlchemy)**: Database table definitions, indexes, relationships.
   - **Database**: Connection lifecycle, session dependencies (`get_db`).

2. **Frontend Layering**:
   - **`src/services/api.js`**: Centralized HTTP client. No direct `fetch()` calls scattered inside random UI components.
   - **`src/pages/`**: Complete screen/page views.
   - **`src/components/`**: Reusable UI blocks, widgets, buttons, modal dialogs.
   - **`src/index.css`**: Design tokens and utilities.

3. **Stateless Backend**:
   - Easily scalable and hot-reload friendly during rapid prototyping.

---

## How to Implement a Problem-Specific Feature Tomorrow

When your hackathon challenge is revealed (e.g. "Create a Task Management System" or "Build a Resource Optimizer"):

### Step 1: Define the Database Model
Create `backend/app/models/task.py`:
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database.base import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```
Register it in `backend/app/models/__init__.py`:
```python
from app.models.task import Task
```

### Step 2: Define Pydantic Request & Response Schemas
Create `backend/app/schemas/task.py`:
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
```

### Step 3: Implement Business Logic in Services
Create `backend/app/services/task_service.py`:
```python
from sqlalchemy.orm import Session
from app.models.task import Task
from app.schemas.task import TaskCreate

class TaskService:
    @staticmethod
    def get_all(db: Session):
        return db.query(Task).all()

    @staticmethod
    def create(db: Session, task_in: TaskCreate):
        task = Task(**task_in.model_dump())
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
```

### Step 4: Expose API Endpoints in Routes
Create `backend/app/routes/tasks.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.schemas.task import TaskCreate, TaskResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[TaskResponse])
def list_tasks(db: Session = Depends(get_db)):
    return TaskService.get_all(db)

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    return TaskService.create(db, task_in)
```

Register the router in `backend/app/routes/api.py`:
```python
from app.routes.tasks import router as tasks_router
api_router.include_router(tasks_router)
```

### Step 5: Add Frontend API Service Methods
In `frontend/src/services/api.js`:
```javascript
export const api = {
  // ... existing methods
  getTasks: () => request('/api/tasks/'),
  createTask: (data) => request('/api/tasks/', { method: 'POST', body: JSON.stringify(data) }),
};
```

### Step 6: Build UI Components
Create `frontend/src/components/TaskList.jsx` and consume `api.getTasks()`.

---

## Database Migrations vs Table Auto-Creation

For a fast-paced 24-hour hackathon, table auto-creation in `main.py` is the fastest method:
```python
# In backend/app/main.py
from app.database.base import Base
from app.database.session import engine
import app.models  # Ensure models are imported

Base.metadata.create_all(bind=engine)
```
This ensures your tables are instantly created upon backend startup without manual migration commands.
