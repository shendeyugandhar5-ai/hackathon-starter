"""DBMS specialist agent (idea.md section 0.5): SQL, normalization, ER
modeling, transactions, indexing, query optimization.
"""
from typing import Optional

from app.agents.base import BaseAgent, SpecialistResponse
from app.agents.llm_client import complete
from app.agents.prompts import DBMS_SYSTEM_PROMPT


class DBMSAgent(BaseAgent):
    name = "dbms"
    system_prompt = DBMS_SYSTEM_PROMPT

    def handle(
        self,
        message: str,
        student_id: str,
        context: Optional[SpecialistResponse] = None,
    ) -> SpecialistResponse:
        text = complete(self.system_prompt, message)
        return SpecialistResponse(response=text)
