from pydantic import BaseModel
from typing import Optional


class DatabaseHealth(BaseModel):
    """Safe schema for database status without exposing secrets."""
    connected: bool
    status: str  # "connected" | "disconnected"
    target: Optional[str] = None
    latency_ms: Optional[float] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Schema for health check response."""
    status: str = "ok"
    environment: Optional[str] = None
    database: str  # "connected" | "disconnected"
    database_details: Optional[DatabaseHealth] = None
    # Readiness of optional subsystems: ml_router, langgraph, rag,
    # llm_configured, progress_engine. Never contains secrets.
    subsystems: dict = {}


class RootResponse(BaseModel):
    """Schema for API root response."""
    message: str
    status: str
    version: str
    docs_url: str
