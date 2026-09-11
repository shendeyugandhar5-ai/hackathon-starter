"""Pydantic schemas for POST /api/chat - the shared contract locked in
idea.md section 7.2, which every workstream builds against in parallel.
"""
from typing import List, Literal, Optional

from pydantic import BaseModel

AgentName = Literal["dsa", "dbms", "maths", "aiml", "general"]


class ChatRequest(BaseModel):
    student_id: str
    conversation_id: Optional[str] = None
    # Optional when an image carries the question; one of the two must be present
    message: str = ""
    # A question photographed or screenshotted by the student, as a browser
    # data URL: "data:image/png;base64,iVBOR..." (max ~6MB decoded)
    image: Optional[str] = None


class MasteryUpdate(BaseModel):
    subject: str
    topic: str
    new_score: float


class Recommendation(BaseModel):
    topic: str
    reason: str
    priority: Literal["low", "medium", "high"]


class ContextUsed(BaseModel):
    """What shared student context shaped this answer - drives the trace panel."""
    weak_topics: List[str] = []
    prerequisite_gaps: List[dict] = []
    recent_messages: int = 0


class TraceEventOut(BaseModel):
    """One observable step of the orchestration graph."""
    step: str
    label: str
    detail: Optional[str] = None
    status: str = "ok"            # ok | skipped | failed
    agent: Optional[str] = None
    confidence: Optional[float] = None
    duration_ms: Optional[float] = None
    data: dict = {}


class RetrievedChunk(BaseModel):
    """A knowledge chunk the RAG layer grounded the answer on."""
    subject: str
    topic: str
    source: str
    score: float


class VerificationOut(BaseModel):
    passed: bool
    confidence: Optional[float] = None
    issues: List[str] = []
    status: str = "ok"            # ok | skipped | unparsed


class KnowledgeCheckOut(BaseModel):
    question: str
    subject: Optional[str] = None
    topic: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: Optional[str] = None
    agent: AgentName
    confidence: float
    routed_reason: str
    response: str
    mastery_updates: List[MasteryUpdate] = []
    recommendation: Optional[Recommendation] = None

    # Every agent that contributed; length > 1 means cross-agent collaboration
    contributing_agents: List[AgentName] = []
    context_used: Optional[ContextUsed] = None

    # --- explainability (added backward-compatibly; all optional) ---------
    teaching_strategy: Optional[str] = None
    supporting_agents: List[AgentName] = []
    retrieved_context: List[RetrievedChunk] = []
    verification: Optional[VerificationOut] = None
    knowledge_check: Optional[KnowledgeCheckOut] = None
    # Ordered execution record driving the Agent Trace panel
    trace_events: List[TraceEventOut] = []
