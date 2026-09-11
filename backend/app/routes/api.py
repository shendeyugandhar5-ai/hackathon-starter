from fastapi import APIRouter
from app.routes.health import router as health_router
from app.routes.chat import router as chat_router
from app.routes.students import router as students_router
from app.routes.ml import router as ml_router

api_router = APIRouter(prefix="/api")

# Core health check router
api_router.include_router(health_router)

# Coordinator + agents (idea.md section 7.2) -> POST /api/chat
api_router.include_router(chat_router)

# Student Brain dashboard, Agent Trace panel, recommendations, assessments
api_router.include_router(students_router)

# Machine Learning & Trained Models (Router, DKT-LSTM, Confusion, Progress Engine)
api_router.include_router(ml_router)

