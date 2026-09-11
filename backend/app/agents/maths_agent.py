"""Maths specialist agent (idea.md section 0.5): algebra, calculus, linear
algebra, probability, statistics, discrete math. Feeds the AIML agent
heavily - most AIML misconceptions trace back to a maths prerequisite gap.
"""
from typing import Optional

from app.agents.base import BaseAgent, SpecialistResponse
from app.agents.llm_client import complete
from app.agents.prompts import MATHS_SYSTEM_PROMPT


class MathsAgent(BaseAgent):
    name = "maths"
    system_prompt = MATHS_SYSTEM_PROMPT

    def handle(
        self,
        message: str,
        student_id: str,
        context: Optional[SpecialistResponse] = None,
    ) -> SpecialistResponse:
        text = complete(self.system_prompt, message)
        return SpecialistResponse(response=text)
