"""Thin wrapper around the LLM call used by every agent.

Centralizing this in one place means swapping providers or models later
only touches this file. Reads GEMINI_API_KEY from settings; when it's
unset (or the `google-generativeai` package isn't installed yet) this
degrades to a canned response so the rest of the stack stays functional.
"""
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("learnos.llm")

_client = None
_client_load_attempted = False


def _get_client():
    global _client, _client_load_attempted
    if _client_load_attempted:
        return _client
    _client_load_attempted = True

    if not settings.GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
    except ImportError:
        logger.warning("google-generativeai package not installed; agents will use canned responses")
        return None

    genai.configure(api_key=settings.GEMINI_API_KEY)
    _client = genai
    return _client


def is_available() -> bool:
    """Whether a real LLM call can actually be made right now."""
    return _get_client() is not None


def complete(system_prompt: str, message: str, model: Optional[str] = None, max_tokens: int = 1024) -> str:
    """Single-turn completion: system prompt + student message -> text.

    Falls back to a canned placeholder when no API key is configured.
    """
    client = _get_client()
    if client is None:
        return (
            "[canned response - set GEMINI_API_KEY to get real answers]\n"
            f"You asked: {message}"
        )

    try:
        gemini_model = client.GenerativeModel(
            model_name=model or settings.LLM_MODEL,
            system_instruction=system_prompt,
        )
        response = gemini_model.generate_content(
            message,
            generation_config={"max_output_tokens": max_tokens},
        )
        return response.text
    except Exception:
        logger.exception("LLM call failed; returning a safe fallback response")
        return "Sorry, I couldn't reach the LLM just now - please try again."
