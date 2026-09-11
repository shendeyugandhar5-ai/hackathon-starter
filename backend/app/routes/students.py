"""Student-facing read endpoints: mastery dashboard, agent trace, recommendations,
plus the assessment submission that drives TEST -> DIAGNOSE -> ADAPT.
"""
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Query

from app.schemas.student import (
    AssessmentResult,
    AssessmentSubmit,
    MasteryResponse,
    MasteryRow,
    RecommendationsResponse,
    SubjectSummary,
    TraceResponse,
)
from app.services import student_service

router = APIRouter(tags=["Student"])


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
        avg = sum(i.score for i in items) / len(items)
        subjects.append(SubjectSummary(
            subject=subject,
            average_score=round(avg, 4),
            topic_count=len(items),
            weak_topics=[i.topic for i in items if i.state == "weak"],
        ))

    overall = round(sum(t.score for t in topics) / len(topics), 4) if topics else 0.0
    return MasteryResponse(student_id=student_id, overall_score=overall,
                           subjects=subjects, topics=topics)


@router.get("/students/{student_id}/trace", response_model=TraceResponse,
            summary="Agent Trace panel history")
def get_trace(student_id: str, limit: int = Query(20, ge=1, le=100)):
    return TraceResponse(student_id=student_id,
                         entries=student_service.get_trace(student_id, limit))


@router.get("/students/{student_id}/recommendations", response_model=RecommendationsResponse,
            summary="Next-best-action recommendations")
def get_recommendations(student_id: str, limit: int = Query(10, ge=1, le=50)):
    return RecommendationsResponse(student_id=student_id,
                                   recommendations=student_service.get_recommendations(student_id, limit))


@router.post("/assessments", response_model=AssessmentResult,
             summary="Submit a knowledge-check answer (updates mastery, may escalate)")
def submit_assessment(payload: AssessmentSubmit):
    return AssessmentResult(**student_service.record_assessment(payload.model_dump()))


@router.get("/conversations/{conversation_id}/messages",
            summary="Full message history for one conversation")
def get_messages(conversation_id: str, limit: int = Query(100, ge=1, le=500)):
    return {
        "conversation_id": conversation_id,
        "messages": student_service.get_conversation_messages(conversation_id, limit),
    }
