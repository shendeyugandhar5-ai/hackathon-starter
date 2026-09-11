"""Maths specialist agent: algebra, calculus, linear algebra, probability,
statistics, discrete math.

Feeds the AIML agent heavily - most AIML misconceptions trace back to a
maths prerequisite gap, which is what root-cause detection surfaces.
"""
from app.agents.base import BaseAgent
from app.agents.prompts import MATHS_SYSTEM_PROMPT


class MathsAgent(BaseAgent):
    name = "maths"
    system_prompt = MATHS_SYSTEM_PROMPT
