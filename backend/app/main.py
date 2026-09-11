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


@app.on_event("startup")
def warm_ocr_engine() -> None:
    """Load the OCR models in the background as soon as the server is up.

    Initialising the ONNX detection/recognition models takes ~10-15s. Paying
    that on the first image a student uploads makes the feature look broken;
    paying it on a background thread at startup means it is ready by the time
    anyone attaches one. Failure here is not fatal - `extract_text` reports
    the same problem per-request.
    """
    import threading

    from app.services.ocr import active_engine

    threading.Thread(target=active_engine, daemon=True,
                     name="ocr-warmup").start()


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
