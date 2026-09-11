"""Verifier / critic agent - final quality control.

Two jobs, deliberately separated:

  `combine_answers`  merges several specialists' answers into one coherent
                     reply (only called when more than one agent ran).
  `verify`           returns a structured verdict on the final answer.

The verifier does NOT rewrite every response. It returns a verdict; only
a failed verdict triggers a single corrective pass, capped at one retry so
a turn can never loop.
"""
import json
import logging
import re
from typing import Any, Dict, List, Tuple

from app.agents.llm_client import complete, is_available
from app.agents.prompts import VERIFIER_SYSTEM_PROMPT

logger = logging.getLogger("learnos.verifier")

MAX_RETRIES = 1

_VERDICT_PROMPT = """You are a strict but fair reviewer of tutoring answers.

Check the answer for:
- factual and conceptual correctness
- mathematical correctness, if any maths is shown
- SQL correctness, if any SQL is shown
- code correctness, if any code is shown
- whether it actually answers the question asked

Reply with ONLY a JSON object, no markdown fence:
{"passed": true/false, "confidence": 0.0-1.0, "issues": ["..."]}

Set passed=false only for a real error that would mislead the student.
Style preferences, missing extras, or brevity are NOT failures."""


def combine_answers(question: str, specialist_answers: List[Tuple[str, str]]) -> str:
    """Merge multiple specialists into one answer in a single teaching voice."""
    if not specialist_answers:
        return ""
    if len(specialist_answers) == 1:
        return specialist_answers[0][1]

    joined = "\n\n".join(
        f"[{agent.upper()} AGENT]\n{answer}" for agent, answer in specialist_answers
    )
    return complete(
        VERIFIER_SYSTEM_PROMPT,
        f"Student question: {question}\n\n"
        f"Specialist answers to combine and sanity-check:\n{joined}",
        max_tokens=1400,
    )


def verify(question: str, answer: str) -> Dict[str, Any]:
    """Structured verdict on the final answer.

    Degrades to a 'skipped' verdict rather than blocking the turn when the
    LLM is unavailable - verification is quality control, not a gate.
    """
    if not is_available():
        return {"passed": True, "confidence": None, "issues": [],
                "status": "skipped", "detail": "no LLM configured"}

    raw = complete(
        _VERDICT_PROMPT,
        f"QUESTION:\n{question}\n\nANSWER TO REVIEW:\n{answer[:4000]}",
        max_tokens=600,
    )

    parsed = _parse_verdict(raw)
    if parsed is None:
        # A malformed verdict must not fail a good answer
        logger.info("Verifier returned unparseable output; treating as pass")
        return {"passed": True, "confidence": None, "issues": [],
                "status": "unparsed", "detail": "verifier output was not valid JSON"}

    parsed["status"] = "ok"
    return parsed


def _parse_verdict(raw: str) -> Dict[str, Any] | None:
    """Pull the JSON verdict out of the model's reply, fences and all."""
    if not raw:
        return None
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
    except (json.JSONDecodeError, ValueError):
        return None

    if not isinstance(data, dict) or "passed" not in data:
        return None

    issues = data.get("issues") or []
    if not isinstance(issues, list):
        issues = [str(issues)]

    confidence = data.get("confidence")
    try:
        confidence = float(confidence) if confidence is not None else None
    except (TypeError, ValueError):
        confidence = None

    return {
        "passed": bool(data["passed"]),
        "confidence": confidence,
        "issues": [str(i) for i in issues][:5],
    }


def correct(question: str, answer: str, issues: List[str], system_prompt: str) -> str:
    """One corrective pass when verification fails. Never loops."""
    issue_text = "\n".join(f"- {i}" for i in issues) or "- the answer contains an error"
    return complete(
        system_prompt,
        f"Your previous answer to this question had problems.\n\n"
        f"QUESTION:\n{question}\n\nYOUR ANSWER:\n{answer[:3000]}\n\n"
        f"PROBLEMS FOUND:\n{issue_text}\n\n"
        f"Rewrite the answer correctly. Do not mention this correction.",
        max_tokens=1400,
    )


# Backwards compatibility: the pre-LangGraph coordinator imported this name.
def verify_and_combine(question: str, specialist_answers: List[Tuple[str, str]]) -> str:
    return combine_answers(question, specialist_answers)
