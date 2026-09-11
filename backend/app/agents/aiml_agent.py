"""AIML specialist agent: ML/DL concepts, model behavior, training dynamics,
algorithm intuition.

Highest cross-agent traffic - most collaboration routes here + Maths + DSA.
"""
from app.agents.base import BaseAgent
from app.agents.prompts import AIML_SYSTEM_PROMPT


class AIMLAgent(BaseAgent):
    name = "aiml"
    system_prompt = AIML_SYSTEM_PROMPT
