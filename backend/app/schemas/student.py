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


class StudentCreate(BaseModel):
    id: str
    name: Optional[str] = None
    goal: Optional[str] = None


class StudentProfile(BaseModel):
    id: str
    name: Optional[str] = None
    goal: Optional[str] = None
    overall_score: float = 0.0
    topic_count: int = 0
    weak_topic_count: int = 0
    conversation_count: int = 0


class ConversationRow(BaseModel):
    id: str
    title: Optional[str] = None
    message_count: int = 0
    created_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None


class PrerequisiteGap(BaseModel):
    """Cross-subject root cause: a weak prerequisite blocking a dependent topic."""
    prerequisite: str
    prerequisite_subject: Optional[str] = None
    score: float
    blocks: str
    blocks_subject: Optional[str] = None
    blocked_score: float
    weight: float = 1.0


class RootCauseResponse(BaseModel):
    student_id: str
    gaps: List[PrerequisiteGap] = []
    summary: Optional[str] = None


class AgentInfo(BaseModel):
    name: str
    label: str
    scope: str


class KnowledgeCheckRequest(BaseModel):
    student_id: str
    subject: Optional[str] = None
    topic: Optional[str] = None


class KnowledgeCheckResponse(BaseModel):
    """A generated quiz question - the TEST half of TEACH -> TEST."""
    student_id: str
    subject: Optional[str] = None
    topic: Optional[str] = None
    agent: Optional[str] = None
    question: str
    reason: Optional[str] = None


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


class GraphNode(BaseModel):
    id: str
    label: str
    node_type: Literal["concept", "question", "agent", "misconception"]
    subject: Optional[str] = None
    mastery: Optional[int] = None
    state: Optional[str] = None
    metadata: dict = {}


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    edge_type: Literal[
        "prerequisite_of",
        "asked_about",
        "answered_by",
        "supported",
        "affects",
        "journey_step",
        "related_to",
    ]
    weight: float = 1.0
    label: Optional[str] = None
    metadata: dict = {}


class GraphSummary(BaseModel):
    total_concepts: int = 0
    mastered_concepts: int = 0
    learning_concepts: int = 0
    weak_concepts: int = 0
    subjects_covered: List[str] = []
    agents_used: List[str] = []
    total_questions: int = 0
    diversification_score: float = 0.0
    top_bottleneck: Optional[str] = None


class TimelineEvent(BaseModel):
    id: str
    timestamp: Optional[str] = None
    event_type: str
    title: str
    description: str
    agent: Optional[str] = None
    subject: Optional[str] = None
    concept: Optional[str] = None


class LearningGraphResponse(BaseModel):
    student_id: str
    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []
    summary: GraphSummary
    timeline: List[TimelineEvent] = []
    is_empty: bool = False


class LearnerGraphContext(BaseModel):
    student_id: str
    weak_concepts: List[dict] = []
    mastered_concepts: List[str] = []
    recent_agents: List[str] = []
    subjects_covered: List[str] = []
    learning_path: List[str] = []
    recent_questions: List[str] = []
    top_bottleneck: Optional[str] = None
    diversification_score: float = 0.0

