"""Student-facing endpoints: profile, mastery dashboard, agent trace,
recommendations, conversation history, root-cause analysis, knowledge
checks, and assessment submission.
"""
from collections import defaultdict
from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.agents.coordinator import AGENT_PROFILES
from app.agents.llm_client import complete, is_real_answer
from app.schemas.student import (
    AgentInfo,
    AssessmentResult,
    AssessmentSubmit,
    ConversationRow,
    KnowledgeCheckRequest,
    KnowledgeCheckResponse,
    LearnerGraphContext,
    LearningGraphResponse,
    MasteryResponse,
    MasteryRow,
    RecommendationsResponse,
    RootCauseResponse,
    StudentCreate,
    StudentProfile,
    SubjectSummary,
    TraceResponse,
)
from app.services import conversation_service, student_service, learning_graph_service
from app.services.context_service import build_context, find_prerequisite_gaps
from app.services.recommendation_engine import derive_recommendations, persist_recommendations

router = APIRouter(tags=["Student"])


# --------------------------------------------------------------- agents ---
@router.get("/agents", response_model=List[AgentInfo], tags=["Agents"],
            summary="List every agent and what it covers")
def list_agents():
    return [AgentInfo(name=name, **profile) for name, profile in AGENT_PROFILES.items()]


# -------------------------------------------------------------- students ---
@router.post("/students", response_model=StudentProfile, status_code=201,
             summary="Create (or upsert) a student")
def create_student(payload: StudentCreate):
    conversation_service.ensure_student(payload.id, payload.name, payload.goal)
    return _profile(payload.id)


@router.get("/students/{student_id}", response_model=StudentProfile,
            summary="Student profile summary")
def get_student(student_id: str):
    return _profile(student_id)


def _profile(student_id: str) -> StudentProfile:
    ctx = build_context(student_id)
    scores = [m["score"] for m in ctx.mastery]
    return StudentProfile(
        id=student_id,
        name=ctx.name,
        goal=ctx.goal,
        overall_score=round(sum(scores) / len(scores), 4) if scores else 0.0,
        topic_count=len(ctx.mastery),
        weak_topic_count=len(ctx.weak_topics),
        conversation_count=len(conversation_service.list_conversations(student_id, limit=100)),
    )


# --------------------------------------------------------------- mastery ---
@router.get("/students/{student_id}/mastery", response_model=MasteryResponse,
            summary="Student Brain dashboard data")
def get_mastery(student_id: str):
    rows = student_service.get_mastery(student_id)
    topics = [MasteryRow(**r) for r in rows]

    by_subject = defaultdict(list)
    for t in topics:
        by_subject[t.subject].append(t)

    subjects: List[SubjectSummary] = []
    for subject, items in sorted(by_subject.items()):
        subjects.append(SubjectSummary(
            subject=subject,
            average_score=round(sum(i.score for i in items) / len(items), 4),
            topic_count=len(items),
            weak_topics=[i.topic for i in items if i.state == "weak"],
        ))

    overall = round(sum(t.score for t in topics) / len(topics), 4) if topics else 0.0
    return MasteryResponse(student_id=student_id, overall_score=overall,
                           subjects=subjects, topics=topics)


# ----------------------------------------------------------------- trace ---
@router.get("/students/{student_id}/trace", response_model=TraceResponse,
            summary="Agent Trace panel history")
def get_trace(student_id: str, limit: int = Query(20, ge=1, le=100)):
    return TraceResponse(student_id=student_id,
                         entries=student_service.get_trace(student_id, limit))


# ------------------------------------------------------- recommendations ---
@router.get("/students/{student_id}/recommendations", response_model=RecommendationsResponse,
            summary="Next-best-action recommendations (recomputed live)")
def get_recommendations(student_id: str, limit: int = Query(10, ge=1, le=50)):
    # Recompute from current mastery so the dashboard is never stale
    ctx = build_context(student_id)
    persist_recommendations(student_id, derive_recommendations(ctx))
    return RecommendationsResponse(
        student_id=student_id,
        recommendations=student_service.get_recommendations(student_id, limit),
    )


# ------------------------------------------------------------ root cause ---
@router.get("/students/{student_id}/root-cause", response_model=RootCauseResponse,
            summary="Cross-subject prerequisite gaps behind weak topics")
def get_root_cause(student_id: str):
    gaps = find_prerequisite_gaps(student_id)
    summary = None
    if gaps:
        top = gaps[0]
        summary = (
            f"{top['prerequisite']} is at {top['score']:.0%} and gates "
            f"{top['blocks']} ({top['blocked_score']:.0%}). Strengthen the "
            f"prerequisite before pushing further on {top['blocks']}."
        )
    return RootCauseResponse(student_id=student_id, gaps=gaps, summary=summary)


# --------------------------------------------------------- conversations ---
@router.get("/students/{student_id}/conversations", response_model=List[ConversationRow],
            summary="All conversations for a student")
def list_conversations(student_id: str, limit: int = Query(20, ge=1, le=100)):
    return conversation_service.list_conversations(student_id, limit)


@router.get("/conversations/{conversation_id}/messages",
            summary="Full message history for one conversation")
def get_messages(conversation_id: str, limit: int = Query(100, ge=1, le=500)):
    return {
        "conversation_id": conversation_id,
        "messages": student_service.get_conversation_messages(conversation_id, limit),
    }


# ------------------------------------------------------- knowledge check ---
@router.post("/knowledge-check", response_model=KnowledgeCheckResponse, tags=["Assessment"],
             summary="Generate a quiz question targeting the student's weakest topic")
def knowledge_check(payload: KnowledgeCheckRequest):
    ctx = build_context(payload.student_id)

    subject, topic, reason = payload.subject, payload.topic, None
    if not topic:
        if ctx.prerequisite_gaps:
            gap = ctx.prerequisite_gaps[0]
            topic = gap["prerequisite"]
            subject = gap.get("prerequisite_subject")
            reason = f"Root cause of weakness in {gap['blocks']}"
        elif ctx.weak_topics:
            weak = ctx.weak_topics[0]
            topic, subject = weak["topic"], weak["subject"]
            reason = f"Weakest topic at {weak['score']:.0%}"
        elif ctx.mastery:
            lowest = ctx.mastery[0]
            topic, subject = lowest["topic"], lowest["subject"]
            reason = "Lowest current mastery"

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="No mastery data for this student yet - send a chat message or seed mastery first.",
        )

    question = complete(
        "You write single short quiz questions for placement-prep students. "
        "Reply with ONLY the question - no preamble, no answer, no numbering.",
        f"Write one concise question testing understanding of '{topic}'"
        + (f" in {subject}." if subject else "."),
        max_tokens=200,
    ).strip()

    if not is_real_answer(question):
        raise HTTPException(
            status_code=503,
            detail="Question generation is unavailable - the LLM could not be reached.",
        )

    return KnowledgeCheckResponse(
        student_id=payload.student_id, subject=subject, topic=topic,
        agent=subject, question=question, reason=reason,
    )


# ----------------------------------------------------------- assessments ---
@router.post("/assessments", response_model=AssessmentResult, tags=["Assessment"],
             summary="Submit an answer (updates mastery, logs misconception, may escalate)")
def submit_assessment(payload: AssessmentSubmit):
    result = student_service.record_assessment(payload.model_dump())
    # Refresh recommendations so the dashboard reacts immediately
    persist_recommendations(payload.student_id,
                            derive_recommendations(build_context(payload.student_id)))
    return AssessmentResult(**result)


# ------------------------------------------------------- learning graph ---
@router.get("/students/{student_id}/learning-graph", response_model=LearningGraphResponse,
            summary="Personalized, persistent student learning journey graph")
def get_learning_graph(student_id: str):
    return learning_graph_service.build_learning_graph(student_id)


@router.get("/students/{student_id}/learning-graph/context", response_model=LearnerGraphContext,
            summary="High-signal graph summary for Coordinator and AI agents")
def get_learning_graph_context(student_id: str):
    return learning_graph_service.get_learner_graph_context(student_id)

