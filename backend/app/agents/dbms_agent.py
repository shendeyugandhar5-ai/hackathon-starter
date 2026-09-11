"""DBMS specialist agent: SQL, normalization, ER modeling, transactions,
indexing, query optimization.
"""
from app.agents.base import BaseAgent
from app.agents.prompts import DBMS_SYSTEM_PROMPT


class DBMSAgent(BaseAgent):
    name = "dbms"
    system_prompt = DBMS_SYSTEM_PROMPT
