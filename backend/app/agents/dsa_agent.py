"""DSA specialist agent: data structures, algorithms, complexity analysis,
problem-solving patterns, debugging.

Behavior comes from BaseAgent.handle - the only thing that differs between
specialists is the name and the system prompt.
"""
from app.agents.base import BaseAgent
from app.agents.prompts import DSA_SYSTEM_PROMPT


class DSAAgent(BaseAgent):
    name = "dsa"
    system_prompt = DSA_SYSTEM_PROMPT
