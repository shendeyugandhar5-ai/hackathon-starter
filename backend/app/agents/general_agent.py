"""General agent - the leaf-node fallback and career-mentor voice.

Hard rule: once the Coordinator routes here, General answers fully - it
never hands off to a specialist mid-turn, and no specialist ever hands off
into it. When it needs the student's mastery picture (e.g. to build a
placement roadmap) it reads it from the shared context, which comes
straight from the database - never by forwarding the live question.
"""
from typing import Optional

from app.agents.base import BaseAgent, SpecialistResponse
from app.agents.llm_client import complete
from app.agents.prompts import GENERAL_SYSTEM_PROMPT


class GeneralAgent(BaseAgent):
    name = "general"
    system_prompt = GENERAL_SYSTEM_PROMPT

    def handle(
        self,
        message: str,
        student_id: str,
        context: Optional[SpecialistResponse] = None,
        student_context: Optional[str] = None,
    ) -> SpecialistResponse:
        # General never receives a mid-turn handoff, so `context` is ignored
        # by design - the coordinator guarantees it is never passed here.
        return SpecialistResponse(
            response=complete(self.build_prompt(student_context), message)
        )
