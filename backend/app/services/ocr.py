"""OCR for image questions.

Why this exists: the chat model we route to (Groq `openai/gpt-oss-120b`) is
text-only. A photographed question therefore has to become *text* before it
can be answered at all. Doing that with OCR rather than a vision model also
keeps the trained router in play - the classifier works on text, so we OCR
first, route on the extracted text, then send that text to the LLM.

Engines are tried in order and the first one that loads wins:

  1. rapidocr-onnxruntime - pure pip, offline, no system binary. The default.
  2. pytesseract          - only if a Tesseract binary is on PATH.
  3. none                 - caller falls back to a vision model, if it has one.

Nothing here raises: OCR failing should degrade the answer, never the turn.
"""
import io
import logging
import re
import shutil
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("learnos.ocr")

# Lines the engine is this unsure about are usually artefacts - page edges,
# JPEG noise, a stray watermark - and hurt routing more than they help.
MIN_LINE_CONFIDENCE = 0.40

# Below this, whatever we read is too thin to be a question. Better to tell
# the student the image was unreadable than to route on three characters.
MIN_USEFUL_CHARS = 8

_engine: Any = None
_engine_name: Optional[str] = None
_load_attempted = False


@dataclass
class OCRResult:
    """Outcome of one OCR attempt. `ok` means the text is worth using."""

    text: str = ""
    engine: str = "none"
    confidence: float = 0.0
    line_count: int = 0
    duration_ms: float = 0.0
    error: Optional[str] = None
    lines: List[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return bool(self.text) and len(self.text) >= MIN_USEFUL_CHARS

    def as_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok,
            "engine": self.engine,
            "confidence": round(self.confidence, 3),
            "line_count": self.line_count,
            "duration_ms": round(self.duration_ms, 1),
            "chars": len(self.text),
            "error": self.error,
        }


def _tesseract_binary() -> Optional[str]:
    """Path to the Tesseract executable, or None.

    pytesseract is useless without it - the Python package is only a wrapper
    around the binary, so both have to be present for that path to work.
    """
    return shutil.which("tesseract")


def _load_engine() -> None:
    """Pick and initialise an OCR engine once, then cache it.

    Model init costs a second or two, so it happens on the first image rather
    than at import - a backend that never sees an image pays nothing.
    """
    global _engine, _engine_name, _load_attempted
    if _load_attempted:
        return
    _load_attempted = True

    try:
        from rapidocr_onnxruntime import RapidOCR

        _engine = RapidOCR()
        _engine_name = "rapidocr"
        logger.info("OCR engine ready: rapidocr-onnxruntime (offline)")
        return
    except ImportError:
        logger.info("rapidocr-onnxruntime not installed; trying tesseract")
    except Exception:
        logger.exception("rapidocr failed to initialise; trying tesseract")

    if _tesseract_binary():
        try:
            import pytesseract  # noqa: F401

            _engine = "pytesseract"
            _engine_name = "tesseract"
            logger.info("OCR engine ready: tesseract")
            return
        except ImportError:
            logger.info("tesseract binary found but pytesseract is not installed")

    _engine_name = "none"
    logger.warning(
        "No OCR engine available - image questions will fall back to the "
        "vision model. Install with: pip install rapidocr-onnxruntime"
    )


def active_engine() -> str:
    """'rapidocr', 'tesseract', or 'none'."""
    _load_engine()
    return _engine_name or "none"


def is_available() -> bool:
    return active_engine() != "none"


def _to_numpy(data: bytes):
    """Decode raw image bytes into an RGB numpy array.

    Goes through Pillow rather than OpenCV's imdecode because Pillow handles
    the formats a browser actually produces (PNG screenshots, phone JPEGs,
    the occasional WebP) with less ceremony.
    """
    import numpy as np
    from PIL import Image

    with Image.open(io.BytesIO(data)) as img:
        # OCR models expect 3 channels; screenshots are often RGBA or L
        return np.array(img.convert("RGB"))


def _clean(text: str) -> str:
    """Tidy OCR output without changing what it says.

    Collapses the run-on spaces OCR inserts between glyphs and drops blank
    lines, but keeps line breaks - they carry structure in code snippets and
    multi-part questions, which is exactly what the specialist agent needs.
    """
    lines = []
    for raw in text.splitlines():
        line = re.sub(r"[ \t]+", " ", raw).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


def _run_rapidocr(array) -> Tuple[List[str], float]:
    """RapidOCR returns (detections, timings); each detection is
    [box, text, score]. Returns (lines, mean_confidence)."""
    output, _ = _engine(array)
    if not output:
        return [], 0.0

    lines: List[str] = []
    scores: List[float] = []
    for detection in output:
        try:
            text, score = detection[1], float(detection[2])
        except (IndexError, TypeError, ValueError):
            continue
        if score < MIN_LINE_CONFIDENCE:
            continue
        text = (text or "").strip()
        if text:
            lines.append(text)
            scores.append(score)

    return lines, (sum(scores) / len(scores) if scores else 0.0)


def _run_tesseract(array) -> Tuple[List[str], float]:
    """Tesseract path.

    Uses image_to_data rather than image_to_string so we get per-word
    confidence instead of a bare string, and can apply the same quality floor
    as the rapidocr path.
    """
    import pytesseract
    from pytesseract import Output

    data = pytesseract.image_to_data(array, output_type=Output.DICT)

    rows: Dict[int, List[str]] = {}
    scores: List[float] = []
    for i, word in enumerate(data.get("text", [])):
        word = (word or "").strip()
        if not word:
            continue
        try:
            conf = float(data["conf"][i]) / 100.0
        except (KeyError, IndexError, ValueError):
            conf = 0.0
        if conf < MIN_LINE_CONFIDENCE:
            continue
        rows.setdefault(data["line_num"][i], []).append(word)
        scores.append(conf)

    lines = [" ".join(words) for _, words in sorted(rows.items()) if words]
    return lines, (sum(scores) / len(scores) if scores else 0.0)


def extract_text(image: Dict[str, Any]) -> OCRResult:
    """Read the text out of a parsed image dict.

    `image` is the {"mime_type", "data"} shape produced by
    `llm_client.parse_data_url`. Never raises - a failure comes back as an
    OCRResult with `ok` False and `error` set, so the caller can decide
    whether to fall back to a vision model.
    """
    if not image or not image.get("data"):
        return OCRResult(error="no image data")

    engine_name = active_engine()
    if engine_name == "none":
        return OCRResult(engine="none", error="no OCR engine installed")

    started = time.perf_counter()
    try:
        array = _to_numpy(image["data"])
        if engine_name == "rapidocr":
            lines, confidence = _run_rapidocr(array)
        else:
            lines, confidence = _run_tesseract(array)

        text = _clean("\n".join(lines))
        duration_ms = (time.perf_counter() - started) * 1000

        result = OCRResult(
            text=text,
            engine=engine_name,
            confidence=confidence,
            line_count=len(lines),
            duration_ms=duration_ms,
            lines=lines,
        )
        if not result.ok:
            result.error = (
                "no readable text found" if not text
                else f"only {len(text)} characters found"
            )
        logger.info("OCR %s: %d lines, %d chars, conf %.2f, %.0fms",
                    engine_name, len(lines), len(text), confidence, duration_ms)
        return result

    except Exception as exc:
        logger.exception("OCR failed")
        return OCRResult(
            engine=engine_name,
            duration_ms=(time.perf_counter() - started) * 1000,
            error=f"{type(exc).__name__}: {exc}"[:200],
        )


def ocr_status() -> Dict[str, Any]:
    """Setup summary for GET /api/diagnostics/ocr."""
    engine = active_engine()
    installed: Dict[str, bool] = {}
    for module in ("rapidocr_onnxruntime", "pytesseract", "PIL", "numpy"):
        try:
            __import__(module)
            installed[module] = True
        except ImportError:
            installed[module] = False

    return {
        "available": engine != "none",
        "active_engine": engine,
        "packages": installed,
        "tesseract_binary": _tesseract_binary(),
        "min_line_confidence": MIN_LINE_CONFIDENCE,
        "min_useful_chars": MIN_USEFUL_CHARS,
    }
