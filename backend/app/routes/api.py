from fastapi import APIRouter
from app.routes.health import router as health_router

api_router = APIRouter(prefix="/api")

# Include core health check router
api_router.include_router(health_router)

# Tomorrow: Add new feature routers here
# Example:
# from app.routes.users import router as users_router
# api_router.include_router(users_router, prefix="/users", tags=["Users"])
