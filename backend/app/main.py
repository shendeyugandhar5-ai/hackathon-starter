import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes.api import api_router
from app.schemas.health import RootResponse

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Reusable FastAPI backend starter for hackathons.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.CORS_ALLOW_ALL else settings.CORS_ORIGINS,
    # Credentials cannot be combined with a "*" origin per the CORS spec
    allow_credentials=not settings.CORS_ALLOW_ALL,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include aggregated API routers (/api/...)
app.include_router(api_router)


@app.get("/", response_model=RootResponse, summary="API Root Status")
def root():
    """Simple API status and welcome response."""
    return RootResponse(
        message=f"Welcome to {settings.PROJECT_NAME}",
        status="running",
        version=settings.PROJECT_VERSION,
        docs_url="/docs"
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
