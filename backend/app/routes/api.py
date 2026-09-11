from fastapi import APIRouter
from app.routes.health import router as health_router
from app.routes.chat import router as chat_router
from app.routes.students import router as students_router
from app.routes.diagnostics import router as diagnostics_router

api_router = APIRouter(prefix="/api")

# Core health check router
api_router.include_router(health_router)

# Coordinator + agents (idea.md section 7.2) -> POST /api/chat
api_router.include_router(chat_router)

# Student Brain dashboard, Agent Trace panel, recommendations, assessments
api_router.include_router(students_router)

# LLM setup verification -> /api/diagnostics/llm
api_router.include_router(diagnostics_router)

# Tomorrow: Add new feature routers here
# Example:
# from app.routes.users import router as users_router
# api_router.include_router(users_router, prefix="/users", tags=["Users"])
