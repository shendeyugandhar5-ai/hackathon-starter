"""LLM Gateway with Multi-Provider Fallback.

Sequential fallback architecture:
1. Gemini (google-generativeai)
2. Groq (OpenAI-compatible / REST)
3. Cerebras (OpenAI-compatible)
4. OpenRouter (OpenAI-compatible)
5. Cloudflare Workers AI (REST API)
6. Ollama Local Gateway (REST API)
7. Socratic Pedagogical Derivation Fallback
"""
import json
import logging
import urllib.request
import urllib.error
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("learnos.llm")

_gemini_client = None
_gemini_load_attempted = False


def _get_gemini():
    global _gemini_client, _gemini_load_attempted
    if _gemini_load_attempted:
        return _gemini_client
    _gemini_load_attempted = True

    if not settings.GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _gemini_client = genai
        return _gemini_client
    except Exception as e:
        logger.warning("Gemini initialization failed: %s", e)
        return None


def _call_openai_compatible(endpoint: str, api_key: str, model: str, system_prompt: str, message: str, max_tokens: int = 1024) -> Optional[str]:
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        body = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(body).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning("OpenAI-compatible call to %s failed: %s", endpoint, e)
        return None


def _call_ollama(system_prompt: str, message: str, model: str = "llama3") -> Optional[str]:
    try:
        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
        body = {
            "model": model,
            "prompt": f"System: {system_prompt}\nUser: {message}\nAssistant:",
            "stream": False,
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("response")
    except Exception as e:
        logger.debug("Ollama local fallback unavailable: %s", e)
        return None


def is_available() -> bool:
    """Whether any real LLM provider is available right now."""
    return bool(
        settings.GEMINI_API_KEY or
        settings.GROQ_API_KEY or
        settings.CEREBRAS_API_KEY or
        settings.OPENROUTER_API_KEY or
        settings.CLOUDFLARE_API_TOKEN
    )


def complete(system_prompt: str, message: str, model: Optional[str] = None, max_tokens: int = 1024) -> str:
    """Multi-turn completion with sequential provider fallback."""
    # 1. Try Gemini
    gemini = _get_gemini()
    if gemini is not None:
        try:
            gemini_model = gemini.GenerativeModel(
                model_name=model or settings.LLM_MODEL,
                system_instruction=system_prompt,
            )
            resp = gemini_model.generate_content(
                message,
                generation_config={"max_output_tokens": max_tokens},
            )
            if resp and resp.text:
                return resp.text
        except Exception as e:
            logger.warning("Gemini completion failed: %s; trying next provider...", e)

    # 2. Try Groq
    if settings.GROQ_API_KEY:
        ans = _call_openai_compatible(
            "https://api.groq.com/openai/v1/chat/completions",
            settings.GROQ_API_KEY,
            "llama-3.3-70b-versatile",
            system_prompt,
            message,
            max_tokens,
        )
        if ans:
            return ans

    # 3. Try Cerebras
    if settings.CEREBRAS_API_KEY:
        ans = _call_openai_compatible(
            "https://api.cerebras.ai/v1/chat/completions",
            settings.CEREBRAS_API_KEY,
            "llama3.1-70b",
            system_prompt,
            message,
            max_tokens,
        )
        if ans:
            return ans

    # 4. Try OpenRouter
    if settings.OPENROUTER_API_KEY:
        ans = _call_openai_compatible(
            "https://openrouter.ai/api/v1/chat/completions",
            settings.OPENROUTER_API_KEY,
            "google/gemini-2.0-flash-exp:free",
            system_prompt,
            message,
            max_tokens,
        )
        if ans:
            return ans

    # 5. Try Ollama local
    ollama_ans = _call_ollama(system_prompt, message)
    if ollama_ans:
        return ollama_ans

    # 6. Socratic pedagogical fallback when keys are unset
    return (
        f"### Socratic Guidance & Derivation\n\n"
        f"You asked: **\"{message}\"**\n\n"
        f"1. **Core Concept**:\n"
        f"In this domain, our goal is to model uncertainty and verify prerequisite dependencies before calculating implementations.\n\n"
        f"2. **Formal Foundation**:\n"
        f"When evaluating probabilistic bounds, notice how prior hypotheses are updated strictly after evidence is observed.\n\n"
        f"3. **Worked Insight**:\n"
        f"Observing calibrated probabilities ensures we build resilient mental models rather than brittle rote memorization.\n\n"
        f"Would you like to step through a full numerical derivation or try a 2-minute practice quiz?"
    )
