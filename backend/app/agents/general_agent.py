"""General agent (idea.md section 0.5) - the leaf-node fallback and
career-mentor voice.

Hard rule: once the Coordinator routes here, General answers fully - it
never hands off to a specialist mid-turn, and no specialist ever hands off
into it. When it needs a student's mastery picture (e.g. building a
placement roadmap) it reads it straight from the database via
`mastery_service`, never by forwarding the question to a specialist.
"""
from typing import Optional

from app.agents.base import BaseAgent, SpecialistResponse
from app.agents.llm_client import complete
from app.agents.prompts import GENERAL_SYSTEM_PROMPT
from app.services.mastery_service import get_mastery_snapshot


class GeneralAgent(BaseAgent):
    name = "general"
    system_prompt = GENERAL_SYSTEM_PROMPT

    def handle(
        self,
        message: str,
        student_id: str,
        context: Optional[SpecialistResponse] = None,
    ) -> SpecialistResponse:
        mastery = get_mastery_snapshot(student_id)
        if mastery:
            mastery_lines = "\n".join(
                f"- {row['subject']} / {row['topic']}: {row['score']:.0%}" for row in mastery
            )
            prompt_message = f"{message}\n\nStudent's current mastery scores:\n{mastery_lines}"
        else:
            prompt_message = message

        text = complete(self.system_prompt, prompt_message)
        return SpecialistResponse(response=text)
