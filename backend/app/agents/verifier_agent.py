"""Optional verifier/guardrail agent (idea.md section 1).

One extra cheap LLM pass that sanity-checks a combined multi-agent answer
before it reaches the student, so cross-agent responses don't contradict
each other (idea.md sections 10, 14; judge Q&A section 9).
"""
from typing import List, Tuple

from app.agents.llm_client import complete
from app.agents.prompts import VERIFIER_SYSTEM_PROMPT


def verify_and_combine(question: str, specialist_answers: List[Tuple[str, str]]) -> str:
    """specialist_answers: (agent_name, response_text) pairs. Returns one combined, checked answer."""
    if len(specialist_answers) == 1:
        return specialist_answers[0][1]

    joined = "\n\n".join(f"[{agent.upper()} AGENT]\n{answer}" for agent, answer in specialist_answers)
    prompt_message = (
        f"Student question: {question}\n\n"
        f"Specialist answers to combine and sanity-check:\n{joined}"
    )
    return complete(VERIFIER_SYSTEM_PROMPT, prompt_message, max_tokens=1200)
