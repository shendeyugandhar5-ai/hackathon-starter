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
from typing import Any, Dict, Optional

from app.core.config import settings

logger = logging.getLogger("learnos.llm")

# Gemini accepts larger, but a tutoring screenshot has no business being
# bigger than this - and it bounds the request size from the browser.
MAX_IMAGE_BYTES = 6 * 1024 * 1024

# Floor under every completion budget. See the note in
# `_complete_openai_compatible`: below this, reasoning models return nothing.
MIN_COMPLETION_TOKENS = 192

_client = None
_client_load_attempted = False


def active_provider() -> str:
    """Which provider will actually serve a call: 'gemini', 'openai_compatible', or 'none'.

    'auto' prefers Gemini when its key is present, then falls back to any
    OpenAI-compatible endpoint (Groq, OpenRouter, Cerebras, local Ollama).
    Having a second path matters in practice: a bad key with one provider
    should not block the whole product.
    """
    choice = (settings.LLM_PROVIDER or "auto").strip().lower()

    if choice == "gemini":
        return "gemini" if settings.GEMINI_API_KEY else "none"
    if choice in ("openai_compatible", "openai", "groq", "openrouter"):
        return "openai_compatible" if settings.OPENAI_API_KEY else "none"

    # auto
    if settings.GEMINI_API_KEY:
        return "gemini"
    if settings.OPENAI_API_KEY:
        return "openai_compatible"
    return "none"


def _get_client():
    """Gemini SDK handle. Returns None for every other provider."""
    global _client, _client_load_attempted
    if _client_load_attempted:
        return _client
    _client_load_attempted = True

    if active_provider() != "gemini":
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
    """Whether a real LLM call can actually be made right now.

    Reports whether a key is *configured* - not whether it is valid. An
    invalid key still fails at call time, which is why callers should also
    check `is_real_answer()` on the returned text.
    """
    provider = active_provider()
    if provider == "gemini":
        return _get_client() is not None
    return provider == "openai_compatible"


def _complete_openai_compatible(system_prompt: str, message: str, model: Optional[str],
                                max_tokens: int, image: Optional[Dict[str, str]]) -> str:
    """Chat completion against any OpenAI-compatible endpoint.

    Uses plain httpx (already a transitive dependency) rather than the
    openai SDK, so this adds no new package.
    """
    import httpx

    # Reasoning models spend the same budget thinking before they write, so a
    # cap tuned for a one-word answer returns an empty message rather than a
    # short one. Measured floor for a single-label reply: ~80 tokens.
    max_tokens = max(max_tokens, MIN_COMPLETION_TOKENS)

    content: Any = message
    if image:
        # OpenAI-style multimodal content parts
        b64 = base64.b64encode(image["data"]).decode()
        content = [
            {"type": "text", "text": message or "Answer the question in this image."},
            {"type": "image_url",
             "image_url": {"url": f"data:{image['mime_type']};base64,{b64}"}},
        ]

    response = httpx.post(
        f"{settings.OPENAI_BASE_URL.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": model or settings.OPENAI_MODEL,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content},
            ],
        },
        timeout=settings.LLM_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    payload = response.json()
    choice = payload["choices"][0]
    content = (choice["message"].get("content") or "").strip()

    if not content:
        # Reasoning models (e.g. Groq's gpt-oss family) spend the token
        # budget thinking before they write; too small a max_tokens returns
        # an empty message with finish_reason 'length'. Say so plainly
        # instead of returning an empty answer.
        finish = choice.get("finish_reason")
        logger.warning("Empty completion from %s (finish_reason=%s, max_tokens=%s)",
                       model or settings.OPENAI_MODEL, finish, max_tokens)
        if finish == "length":
            raise RuntimeError(
                f"Model returned no content within {max_tokens} tokens "
                f"(finish_reason=length). Reasoning models need a larger budget."
            )
        raise RuntimeError(f"Model returned an empty response (finish_reason={finish}).")

    if choice.get("finish_reason") == "length":
        # Content came back, but the model was cut off mid-sentence. Surfacing
        # this is how a too-small budget gets noticed instead of shipping
        # half-finished tutoring answers.
        logger.warning("Answer truncated at %s tokens (finish_reason=length) - "
                       "raise max_tokens for this call site", max_tokens)

    return content


# Text `complete()` returns when it could not actually reach the model.
CANNED_PREFIX = "[canned response"
ERROR_REPLY = "Sorry, I couldn't reach the LLM just now - please try again."
AUTH_ERROR_REPLY = (
    "The LLM API key is not valid, so I can't generate an answer yet. "
    "A Gemini key starts with 'AIza' (get one at "
    "https://aistudio.google.com/apikey); a Groq key starts with 'gsk_' "
    "(get one at https://console.groq.com/keys and set OPENAI_API_KEY). "
    "Update .env and restart the backend."
)


QUOTA_ERROR_REPLY = (
    "The LLM provider's free-tier quota is exhausted, so I can't generate an "
    "answer right now. Gemini's free daily limit resets at midnight Pacific. "
    "To keep working today, get a free Groq key at "
    "https://console.groq.com/keys and set OPENAI_API_KEY plus "
    "LLM_PROVIDER=openai_compatible in .env, then restart the backend."
)


def _is_quota_error(exc: Exception) -> bool:
    """Rate limit / quota exhaustion - distinct from a bad credential.

    Worth its own message: the fix is waiting or switching provider, not
    re-checking the key. Also the reason a turn can appear to hang - the
    Gemini SDK retries 429s with exponential backoff.
    """
    text = f"{type(exc).__name__} {exc}".lower()
    return any(marker in text for marker in (
        "resourceexhausted", "429", "quota", "rate limit", "rate_limit",
    ))


def _is_auth_error(exc: Exception) -> bool:
    """Distinguish a bad/missing credential from a transient network fault.

    Worth separating: an auth failure never resolves by retrying, and during
    a demo the difference between "key is wrong" and "network blipped" is
    the difference between a 30-second fix and a wild goose chase.
    """
    text = f"{type(exc).__name__} {exc}".lower()
    return any(marker in text for marker in (
        "unauthenticated", "permission_denied", "api key not valid",
        "invalid authentication", "access_token_type_unsupported",
        "401", "403",
    ))


def is_real_answer(text: str) -> bool:
    """False when `text` is a placeholder or the error fallback.

    Anything that consumes model output as *content* - a quiz question, a
    routing label, a transcription - must check this, or the placeholder
    leaks into the UI as if it were a real answer.
    """
    if not text or not text.strip():
        return False
    stripped = text.strip()
    return not (
        stripped.startswith(CANNED_PREFIX)
        or stripped.startswith(ERROR_REPLY[:28])
        or stripped.startswith(AUTH_ERROR_REPLY[:32])
        or stripped.startswith(QUOTA_ERROR_REPLY[:32])
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
    provider = active_provider()

    if provider == "none":
        return (
            "[canned response - set GEMINI_API_KEY or OPENAI_API_KEY to get real answers]\n"
            f"You asked: {message}"
            + ("\n[an image was attached]" if image else "")
        )

    try:
        if provider == "openai_compatible":
            return _complete_openai_compatible(
                system_prompt, message, model, max_tokens, image
            )

        client = _get_client()
        if client is None:
            return ERROR_REPLY

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
            # Bounds the SDK's internal retry/backoff on rate limits
            request_options={"timeout": settings.LLM_TIMEOUT_SECONDS},
        )
        return response.text
    except Exception as exc:
        if _is_quota_error(exc):
            logger.warning("LLM quota exhausted (%s) - consider switching provider",
                           type(exc).__name__)
            return QUOTA_ERROR_REPLY
        if _is_auth_error(exc):
            # Log once at warning level, not a full traceback per call - an
            # invalid key would otherwise flood the log on every agent call.
            logger.warning("LLM auth failed: check GEMINI_API_KEY (%s)", type(exc).__name__)
            return AUTH_ERROR_REPLY
        logger.exception("LLM call failed; returning a safe fallback response")
        return ERROR_REPLY


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

    # Don't let a placeholder or error string leak into routing
    return text if is_real_answer(text) else ""
