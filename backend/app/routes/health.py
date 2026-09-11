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

    # Subsystem readiness. Each probe is defensive: a broken optional
    # subsystem must not make the health endpoint itself fail.
    subsystems = {}

    try:
        from app.agents.router import _load_trained_model
        from app.agents import router as _router_mod
        _load_trained_model()
        subsystems["ml_router"] = _router_mod._classifier is not None
    except Exception:
        subsystems["ml_router"] = False

    try:
        from app.agents.graph import graph_available
        subsystems["langgraph"] = graph_available()
    except Exception:
        subsystems["langgraph"] = False

    try:
        from app.knowledge.retriever import corpus_stats
        subsystems["rag"] = corpus_stats()
    except Exception:
        subsystems["rag"] = {"available": False}

    try:
        from app.agents.llm_client import is_available
        # Reports whether a key is configured - not whether it is valid
        subsystems["llm_configured"] = is_available()
    except Exception:
        subsystems["llm_configured"] = False

    try:
        from app.services.progress_engine import engine_status
        subsystems["progress_engine"] = engine_status()
    except Exception:
        subsystems["progress_engine"] = {"bkt": False}

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
        ),
        subsystems=subsystems,
    )
