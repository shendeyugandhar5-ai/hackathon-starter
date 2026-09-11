"""LLM and OCR diagnostics.

Answers one question quickly: *is the LLM setup actually working, and if
not, exactly why?* Three failure modes look identical from the chat UI -
a bad key, a retired/unavailable model, and an exhausted quota - but each
needs a different fix. These endpoints separate them.

The OCR endpoint answers the same kind of question for image questions,
which depend on OCR entirely: the chat model is text-only.

Safe to expose in development: no key is ever returned, only a masked
prefix (enough to tell 'gsk_' from 'AIza' from an OAuth token).
"""
import logging
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter

from app.agents.llm_client import active_provider, complete, is_real_answer
from app.core.config import settings
from app.services.ocr import extract_text, ocr_status

logger = logging.getLogger("learnos.diagnostics")

router = APIRouter(tags=["Diagnostics"])


def _mask(key: str) -> Dict[str, Any]:
    """Describe a key without revealing it."""
    if not key:
        return {"configured": False, "prefix": None, "length": 0, "looks_like": "missing"}

    prefix = key[:4]
    looks_like = (
        "gemini_api_key" if key.startswith("AIza")
        else "groq_api_key" if key.startswith("gsk_")
        else "openrouter_api_key" if key.startswith("sk-or")
        else "openai_api_key" if key.startswith("sk-")
        else "oauth_token_NOT_an_api_key" if key.startswith(("AQ.", "ya29."))
        else "unrecognized"
    )
    return {"configured": True, "prefix": f"{prefix}...", "length": len(key),
            "looks_like": looks_like}


@router.get("/diagnostics/llm", summary="Is the LLM configured and reachable?")
def llm_diagnostics() -> Dict[str, Any]:
    """Configuration + a real round-trip call, with the failure reason named.

    `ok: true` means a genuine completion came back. Anything else includes
    `hint` telling you what to change.
    """
    provider = active_provider()

    config: Dict[str, Any] = {
        "llm_provider_setting": settings.LLM_PROVIDER,
        "active_provider": provider,
        "gemini": {"key": _mask(settings.GEMINI_API_KEY), "model": settings.LLM_MODEL},
        "openai_compatible": {
            "key": _mask(settings.OPENAI_API_KEY),
            "base_url": settings.OPENAI_BASE_URL,
            "model": settings.OPENAI_MODEL,
        },
        "timeout_seconds": settings.LLM_TIMEOUT_SECONDS,
    }

    if provider == "none":
        return {
            "ok": False, "reason": "no_provider_configured", "config": config,
            "hint": "Set GEMINI_API_KEY, or set OPENAI_API_KEY with "
                    "LLM_PROVIDER=openai_compatible, then restart the backend.",
        }

    started = time.perf_counter()
    # Generous budget on purpose: reasoning models (Groq's gpt-oss family)
    # spend tokens thinking before writing, so a tiny cap returns an empty
    # message and the probe would report a false failure.
    answer = complete(
        "You are a tutor. Reply with exactly: LLM OK",
        "Reply with exactly: LLM OK",
        max_tokens=200,
    )
    latency_ms = round((time.perf_counter() - started) * 1000, 1)

    if is_real_answer(answer):
        return {
            "ok": True, "reason": "working", "config": config,
            "latency_ms": latency_ms, "sample_response": answer.strip()[:200],
            "hint": None,
        }

    # complete() already classified the failure into its reply text
    lowered = answer.lower()
    if "quota" in lowered:
        reason, hint = "quota_exhausted", (
            "The provider's free-tier quota is used up. Wait for the reset, or "
            "switch provider (Groq: https://console.groq.com/keys)."
        )
    elif "not valid" in lowered or "key" in lowered:
        reason, hint = "invalid_key", (
            "The key was rejected. Check `looks_like` in config above - an "
            "OAuth token (AQ./ya29.) is not an API key."
        )
    else:
        reason, hint = "call_failed", (
            "The call failed. Check the model name is available to your account "
            "with GET /api/diagnostics/llm/models."
        )

    return {"ok": False, "reason": reason, "config": config,
            "latency_ms": latency_ms, "error_reply": answer.strip()[:300], "hint": hint}


@router.get("/diagnostics/ocr", summary="Is OCR working on uploaded images?")
def ocr_diagnostics() -> Dict[str, Any]:
    """Reports the OCR engine and proves it by reading a generated test image.

    Image questions depend on this: the chat model is text-only, so if OCR is
    unavailable a photographed question cannot be answered at all. Worth being
    able to check in one request rather than by uploading a screenshot.
    """
    status = ocr_status()

    if not status["available"]:
        return {
            "ok": False, "reason": "no_engine_installed", "config": status,
            "hint": "Install the offline engine: pip install rapidocr-onnxruntime "
                    "(no system binary needed), then restart the backend.",
        }

    # Render a known phrase, OCR it back, and compare. A self-test beats
    # reporting "installed" - the packages can import and still fail to run.
    probe = _render_probe_image("OCR IS WORKING 123")
    if probe is None:
        return {"ok": True, "reason": "engine_loaded_not_verified", "config": status,
                "hint": "Pillow could not render a test image; the engine itself loaded."}

    started = time.perf_counter()
    result = extract_text({"mime_type": "image/png", "data": probe})
    latency_ms = round((time.perf_counter() - started) * 1000, 1)

    read = result.text.upper().replace(" ", "")
    recognised = "OCRISWORKING" in read

    if result.ok and recognised:
        return {"ok": True, "reason": "working", "config": status,
                "latency_ms": latency_ms, "self_test": result.as_dict(),
                "extracted_text": result.text, "hint": None}

    return {
        "ok": False,
        "reason": "self_test_failed" if result.ok else "no_text_extracted",
        "config": status, "latency_ms": latency_ms,
        "self_test": result.as_dict(), "extracted_text": result.text,
        "hint": "The engine ran but misread a clean test image. Real photos "
                "will be worse - check the installed version of the engine.",
    }


def _render_probe_image(text: str) -> Optional[bytes]:
    """A PNG containing `text`, for the OCR self-test.

    Prefers a real TrueType face at a readable size. Pillow's built-in bitmap
    font is a poor probe: upscaled it goes blurry, the engine drops spaces,
    and the self-test then fails on an image no student would ever send.
    """
    try:
        import io

        from PIL import Image, ImageDraw, ImageFont

        font = None
        for path in ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf",
                     "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
            try:
                font = ImageFont.truetype(path, 34)
                break
            except OSError:
                continue

        image = Image.new("RGB", (620, 110), "white")
        draw = ImageDraw.Draw(image)
        draw.text((30, 35), text, fill="black", font=font)

        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()
    except Exception:
        logger.warning("Could not render OCR probe image", exc_info=True)
        return None


@router.get("/diagnostics/llm/models",
            summary="Which models does the configured provider actually offer?")
def list_models() -> Dict[str, Any]:
    """Lists models your key can use.

    A 404 'model does not exist' is one of the most common setup failures -
    provider catalogues change and a model available last month may be gone.
    """
    provider = active_provider()

    if provider == "openai_compatible":
        try:
            import httpx

            response = httpx.get(
                f"{settings.OPENAI_BASE_URL.rstrip('/')}/models",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                timeout=settings.LLM_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            models: List[str] = sorted(m["id"] for m in response.json().get("data", []))
            return {
                "ok": True, "provider": provider,
                "base_url": settings.OPENAI_BASE_URL,
                "configured_model": settings.OPENAI_MODEL,
                "configured_model_available": settings.OPENAI_MODEL in models,
                "models": models,
            }
        except Exception as exc:
            logger.warning("Model listing failed: %s", type(exc).__name__)
            return {"ok": False, "provider": provider, "error": str(exc)[:200]}

    if provider == "gemini":
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.GEMINI_API_KEY)
            models = sorted(
                m.name.replace("models/", "")
                for m in genai.list_models()
                if "generateContent" in getattr(m, "supported_generation_methods", [])
            )
            return {
                "ok": True, "provider": provider,
                "configured_model": settings.LLM_MODEL,
                "configured_model_available": settings.LLM_MODEL in models,
                "models": models,
            }
        except Exception as exc:
            logger.warning("Model listing failed: %s", type(exc).__name__)
            return {"ok": False, "provider": provider, "error": str(exc)[:200]}

    return {"ok": False, "provider": "none",
            "error": "No provider configured - set a key in .env first."}
