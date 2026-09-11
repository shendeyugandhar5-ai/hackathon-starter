"""Shared types for the agent layer.

Defines the response contract every specialist agent (and General) hands
back to the Coordinator, plus the typed misconception taxonomy and teaching
strategies from idea.md section 1 / section 6.
"""
from typing import List, Literal, Optional

from pydantic import BaseModel

AgentName = Literal["dsa", "dbms", "maths", "aiml", "general"]

# Typed misconception taxonomy (idea.md section 1) - tag wrong answers with
# one of these instead of free text so root-cause detection stays queryable.
MISCONCEPTION_TYPES = [
    "sign_error",
    "unit_confusion",
    "definition_confusion",
    "off_by_one",
    "base_case_missing",
    "formula_misapplication",
    "logic_error",
    "other",
]

TeachingStrategy = Literal[
    "hint",
    "step_by_step",
    "worked_example",
    "socratic",
    "analogy",
    "visual",
    "quiz_first",
    "exam_revision",
    "coding_example",
]


class MasteryUpdate(BaseModel):
    subject: str
    topic: str
    new_score: float


class Recommendation(BaseModel):
    topic: str
    reason: str
    priority: Literal["low", "medium", "high"]


class SpecialistResponse(BaseModel):
    """What every specialist agent (and General) hands back to the Coordinator."""

    response: str
    teaching_strategy: Optional[TeachingStrategy] = None
    misconception: Optional[str] = None  # one of MISCONCEPTION_TYPES, when diagnosing a wrong answer
    mastery_updates: List[MasteryUpdate] = []
    recommendation: Optional[Recommendation] = None

    # Handoff is specialist-to-specialist only (idea.md section 0.5) -
    # handoff_target must never be "general", and General must never set
    # needs_handoff at all.
    needs_handoff: bool = False
    handoff_target: Optional[AgentName] = None


class BaseAgent:
    """Base class for the four subject specialists and the General agent."""

    name: AgentName = "general"
    system_prompt: str = ""

    def handle(
        self,
        message: str,
        student_id: str,
        context: Optional[SpecialistResponse] = None,
    ) -> SpecialistResponse:
        raise NotImplementedError
