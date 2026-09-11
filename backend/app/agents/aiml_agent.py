"""AIML specialist agent (idea.md section 0.5): ML/DL concepts, model
behavior, training dynamics, algorithm intuition. Highest cross-agent
traffic - expect most collaboration demos to route here + Maths + DSA.
"""
from typing import Optional

from app.agents.base import BaseAgent, SpecialistResponse
from app.agents.llm_client import complete
from app.agents.prompts import AIML_SYSTEM_PROMPT


class AIMLAgent(BaseAgent):
    name = "aiml"
    system_prompt = AIML_SYSTEM_PROMPT

    def handle(
        self,
        message: str,
        student_id: str,
        context: Optional[SpecialistResponse] = None,
    ) -> SpecialistResponse:
        text = complete(self.system_prompt, message)
        return SpecialistResponse(response=text)
