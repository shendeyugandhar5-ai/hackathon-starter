"""Agent Trace events - the explainability layer.

Every meaningful step of a turn appends a TraceEvent. The frontend's
AgentTracePanel renders these directly, so what the judge sees is the
actual execution path, not a hardcoded storyboard.

Kept deliberately dependency-free: a plain list of typed events that the
LangGraph state carries along and the response serializes.
"""
import time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

# Step identifiers, in the order they normally occur. The UI uses these to
# pick an icon/label, so keep them stable.
STEP_QUERY_RECEIVED = "query_received"
STEP_ROUTER = "ml_router"
STEP_STUDENT_CONTEXT = "student_context"
STEP_COORDINATOR = "coordinator_decision"
STEP_RAG = "rag_retrieval"
STEP_SPECIALIST = "specialist_response"
STEP_COLLABORATION = "collaboration"
STEP_VERIFIER = "verification"
STEP_KNOWLEDGE_CHECK = "knowledge_check"
STEP_MASTERY = "mastery_update"
STEP_RECOMMENDATION = "recommendation"
STEP_ERROR = "error"


class TraceEvent(BaseModel):
    """One observable step in handling a student turn."""

    step: str
    label: str
    detail: Optional[str] = None
    status: str = "ok"          # ok | skipped | failed
    agent: Optional[str] = None
    confidence: Optional[float] = None
    duration_ms: Optional[float] = None
    data: Dict[str, Any] = Field(default_factory=dict)


class TraceRecorder:
    """Collects trace events for a single turn.

    Never raises: a failure inside tracing must not break /api/chat.
    """

    def __init__(self) -> None:
        self._events: List[TraceEvent] = []
        self._t0 = time.perf_counter()

    def add(self, step: str, label: str, detail: Optional[str] = None,
            status: str = "ok", agent: Optional[str] = None,
            confidence: Optional[float] = None, **data: Any) -> None:
        try:
            self._events.append(TraceEvent(
                step=step,
                label=label,
                detail=detail,
                status=status,
                agent=agent,
                confidence=confidence,
                duration_ms=round((time.perf_counter() - self._t0) * 1000, 1),
                data=data,
            ))
        except Exception:  # pragma: no cover - tracing must never break a turn
            pass

    def skip(self, step: str, label: str, detail: str) -> None:
        """Record a step that was deliberately not run.

        Skips matter for the demo: they show the coordinator *choosing* not
        to invoke RAG/verifier/quiz, rather than the feature being absent.
        """
        self.add(step, label, detail, status="skipped")

    def fail(self, step: str, label: str, detail: str) -> None:
        self.add(step, label, detail, status="failed")

    @property
    def events(self) -> List[TraceEvent]:
        return self._events

    def dump(self) -> List[Dict[str, Any]]:
        return [e.model_dump() for e in self._events]
