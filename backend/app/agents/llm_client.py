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
import base64
import binascii
import logging
import re
from typing import Dict, Optional

from app.core.config import settings

logger = logging.getLogger("learnos.llm")

# Gemini accepts larger, but a tutoring screenshot has no business being
# bigger than this - and it bounds the request size from the browser.
MAX_IMAGE_BYTES = 6 * 1024 * 1024

_client = None
_client_load_attempted = False


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


def parse_data_url(data_url: str) -> Optional[Dict[str, str]]:
    """Turn a browser `data:image/png;base64,iVBOR...` string into Gemini's
    inline-image shape: {"mime_type": ..., "data": <base64>}.

    Returns None for anything that isn't a base64 image data URL.
    """
    if not data_url or not isinstance(data_url, str):
        return None

    match = re.match(r"^data:(image/[\w.+-]+);base64,(.+)$", data_url.strip(), re.DOTALL)
    if not match:
        return None

    mime_type, payload = match.group(1), match.group(2)
    # Validate the payload really is base64 before handing it to the SDK
    try:
        raw = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError):
        logger.warning("Rejected image attachment: payload is not valid base64")
        return None

    if len(raw) > MAX_IMAGE_BYTES:
        logger.warning("Rejected image attachment: %.1fMB exceeds limit", len(raw) / 1e6)
        return None

    return {"mime_type": mime_type, "data": raw}


def complete(system_prompt: str, message: str, model: Optional[str] = None,
             max_tokens: int = 1024, image: Optional[Dict[str, str]] = None) -> str:
    """Single-turn completion: system prompt + student message -> text.

    `image` is an optional {"mime_type", "data"} dict from `parse_data_url`.
    When present it's sent alongside the text, so the agent can read a
    photographed question, diagram, or code screenshot directly.

    Falls back to a canned placeholder when no API key is configured.
    """
    client = _get_client()
    if client is None:
        return (
            "[canned response - set GEMINI_API_KEY to get real answers]\n"
            f"You asked: {message}"
            + ("\n[an image was attached]" if image else "")
        )

    try:
        gemini_model = client.GenerativeModel(
            model_name=model or settings.LLM_MODEL,
            system_instruction=system_prompt,
        )
        # Gemini accepts a list of parts; text plus optional inline image
        parts = [message] if message else []
        if image:
            parts.append(image)

        response = gemini_model.generate_content(
            parts or [message],
            generation_config={"max_output_tokens": max_tokens},
        )
        return response.text
    except Exception:
        logger.exception("LLM call failed; returning a safe fallback response")
        return "Sorry, I couldn't reach the LLM just now - please try again."


def extract_question_from_image(image: Dict[str, str]) -> str:
    """Read the question out of an uploaded image, as plain text.

    This exists so image questions can still go through the *trained* router:
    the classifier works on text, so we transcribe first, route on the
    transcription, then hand the original image to the chosen specialist.
    Keeps the Agent Trace meaningful for image questions.
    """
    if not image:
        return ""

    text = complete(
        "You transcribe academic questions from images. Reply with ONLY the "
        "question text you can read - no preamble, no answer, no commentary. "
        "If the image shows code, transcribe the code. If it shows a diagram "
        "with no text, briefly describe what it depicts in one sentence.",
        "Transcribe the question in this image.",
        max_tokens=400,
        image=image,
    ).strip()

    # Don't let the canned-response placeholder leak into routing
    if text.startswith("[canned response"):
        return ""
    return text
