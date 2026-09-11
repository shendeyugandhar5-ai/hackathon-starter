from fastapi import APIRouter
from app.schemas.health import HealthResponse, DatabaseHealth
from app.database.session import test_db_connectivity
from app.core.config import settings

router = APIRouter(tags=["Health & Status"])


@router.get("/health", response_model=HealthResponse, summary="Service & Database Health Check")
def get_health():
    """Returns application status and database connectivity details without exposing credentials."""
    db_result = test_db_connectivity()
    is_connected = db_result["connected"]

    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        database="connected" if is_connected else "disconnected",
        database_details=DatabaseHealth(
            connected=is_connected,
            status="connected" if is_connected else "disconnected",
            target=db_result.get("target"),
            latency_ms=db_result.get("latency_ms"),
            error=db_result.get("error"),
        )
    )
