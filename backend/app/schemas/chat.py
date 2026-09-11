"""Pydantic schemas for POST /api/chat - the shared contract locked in
idea.md section 7.2, which every workstream builds against in parallel.
"""
from typing import List, Literal, Optional

from pydantic import BaseModel

AgentName = Literal["dsa", "dbms", "maths", "aiml", "general"]


class ChatRequest(BaseModel):
    student_id: str
    conversation_id: Optional[str] = None
    message: str


class MasteryUpdate(BaseModel):
    subject: str
    topic: str
    new_score: float


class Recommendation(BaseModel):
    topic: str
    reason: str
    priority: Literal["low", "medium", "high"]


class ChatResponse(BaseModel):
    conversation_id: Optional[str] = None
    agent: AgentName
    confidence: float
    routed_reason: str
    response: str
    mastery_updates: List[MasteryUpdate] = []
    recommendation: Optional[Recommendation] = None
