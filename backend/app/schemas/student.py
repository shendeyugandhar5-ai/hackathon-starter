"""Schemas for the Student Brain dashboard, Agent Trace panel, and assessments."""
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel

MasteryState = Literal["new", "learning", "weak", "mastered"]


class MasteryRow(BaseModel):
    subject: str
    topic: str
    score: float
    state: MasteryState
    attempts: int = 0
    source: str = "bkt"


class SubjectSummary(BaseModel):
    subject: str
    average_score: float
    topic_count: int
    weak_topics: List[str] = []


class MasteryResponse(BaseModel):
    student_id: str
    overall_score: float
    subjects: List[SubjectSummary] = []
    topics: List[MasteryRow] = []


class TraceEntry(BaseModel):
    """One coordinator routing decision - powers the Agent Trace panel."""
    id: Optional[str] = None
    message: Optional[str] = None
    agent: str
    confidence: Optional[float] = None
    used_llm_fallback: bool = False
    routed_reason: Optional[str] = None
    created_at: Optional[datetime] = None


class TraceResponse(BaseModel):
    student_id: str
    entries: List[TraceEntry] = []


class RecommendationRow(BaseModel):
    id: Optional[str] = None
    topic: str
    reason: Optional[str] = None
    priority: Literal["low", "medium", "high"] = "medium"
    done: bool = False
    created_at: Optional[datetime] = None


class RecommendationsResponse(BaseModel):
    student_id: str
    recommendations: List[RecommendationRow] = []


class AssessmentSubmit(BaseModel):
    student_id: str
    conversation_id: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    question: str
    expected_answer: Optional[str] = None
    student_answer: str
    is_correct: bool
    confidence_rating: Optional[int] = None
    misconception_type: Optional[str] = None


class AssessmentResult(BaseModel):
    """TEST -> DIAGNOSE -> ADAPT: what the system did with the answer."""
    assessment_id: Optional[str] = None
    is_correct: bool
    topic: Optional[str] = None
    previous_score: Optional[float] = None
    new_score: Optional[float] = None
    state: Optional[MasteryState] = None
    misconception_logged: Optional[str] = None
    escalate_to_human: bool = False
    escalation_reason: Optional[str] = None
