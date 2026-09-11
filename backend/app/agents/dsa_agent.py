"""DSA specialist agent (idea.md section 0.5): data structures, algorithms,
complexity analysis, problem-solving patterns, debugging.
"""
from typing import Optional

from app.agents.base import BaseAgent, SpecialistResponse
from app.agents.llm_client import complete
from app.agents.prompts import DSA_SYSTEM_PROMPT


class DSAAgent(BaseAgent):
    name = "dsa"
    system_prompt = DSA_SYSTEM_PROMPT

    def handle(
        self,
        message: str,
        student_id: str,
        context: Optional[SpecialistResponse] = None,
    ) -> SpecialistResponse:
        text = complete(self.system_prompt, message)
        return SpecialistResponse(response=text)
