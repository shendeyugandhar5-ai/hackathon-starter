"""Subject-aware retrieval for grounded agent answers.

Design decision worth stating plainly: retrieval here is TF-IDF + cosine
similarity over scikit-learn, which is already a dependency because the
Tier-1 router uses it. That was chosen over an embedding model + vector
database for three reasons:

  1. Zero new infrastructure and no model download - it initializes in
     milliseconds at import and cannot fail at demo time.
  2. The corpus is small (tens of chunks). Dense embeddings win on large,
     paraphrase-heavy corpora; on a curated corpus this size, lexical
     overlap with technical terms ("conditional probability", "BCNF",
     "base case") is a strong signal.
  3. No embedding API call per query - retrieval stays free and instant.

The interface below is intentionally the same shape a vector store would
expose (`retrieve(query, subjects, k)` -> ranked chunks with metadata), so
swapping in pgvector or Chroma later is a change to this file alone.

Subject-aware by design: retrieval is filtered to the agent's own subject
(plus any collaborating subjects) rather than searching everything.
"""
import logging
import os
import re
from typing import Any, Dict, List, Optional

from app.knowledge.corpus import DOCUMENTS

logger = logging.getLogger("learnos.rag")

DOCS_DIR = os.path.join(os.path.dirname(__file__), "docs")

# Below this cosine similarity a "match" is noise; better to ground on
# nothing than to inject an irrelevant chunk into the prompt.
MIN_SIMILARITY = 0.06

_vectorizer = None
_matrix = None
_chunks: List[Dict[str, Any]] = []
_ready = False


def _load_markdown_docs() -> List[Dict[str, Any]]:
    """Load any .md files dropped into app/knowledge/docs/.

    Convention: docs/<subject>/<topic>.md. Lets the corpus be extended
    without editing Python.
    """
    found: List[Dict[str, Any]] = []
    if not os.path.isdir(DOCS_DIR):
        return found

    for subject in os.listdir(DOCS_DIR):
        subject_dir = os.path.join(DOCS_DIR, subject)
        if not os.path.isdir(subject_dir):
            continue
        for filename in os.listdir(subject_dir):
            if not filename.endswith(".md"):
                continue
            path = os.path.join(subject_dir, filename)
            try:
                with open(path, encoding="utf-8") as f:
                    text = f.read().strip()
            except OSError:
                continue
            # Split on blank lines into paragraph-sized chunks
            for para in [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) > 80]:
                found.append({
                    "subject": subject,
                    "topic": os.path.splitext(filename)[0],
                    "source": f"{subject}/{filename}",
                    "difficulty": "unknown",
                    "text": para,
                })
    return found


def _build_index() -> None:
    """Build the TF-IDF index once, lazily, at first retrieval."""
    global _vectorizer, _matrix, _chunks, _ready
    if _ready:
        return
    _ready = True

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer

        _chunks = list(DOCUMENTS) + _load_markdown_docs()
        if not _chunks:
            logger.warning("Knowledge corpus is empty; RAG disabled")
            return

        # Index topic and subject alongside the text so a query mentioning
        # a topic name matches its chunk even when wording differs.
        corpus = [
            f"{c['subject']} {c['topic'].replace('_', ' ')} {c['text']}"
            for c in _chunks
        ]
        _vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
        )
        _matrix = _vectorizer.fit_transform(corpus)
        logger.info("RAG index built: %d chunks", len(_chunks))
    except Exception:
        logger.exception("Failed to build RAG index; agents will answer ungrounded")
        _vectorizer = None
        _matrix = None


def is_available() -> bool:
    _build_index()
    return _vectorizer is not None and bool(_chunks)


def retrieve(query: str, subjects: Optional[List[str]] = None,
             k: int = 3) -> List[Dict[str, Any]]:
    """Return the top-k most relevant chunks, optionally filtered by subject.

    `subjects` is the metadata filter - pass the primary agent's subject
    plus any supporting agents' subjects for a cross-domain question.
    Returns [] rather than raising if anything goes wrong.
    """
    _build_index()
    if _vectorizer is None or _matrix is None or not query.strip():
        return []

    try:
        from sklearn.metrics.pairwise import cosine_similarity

        scores = cosine_similarity(_vectorizer.transform([query]), _matrix)[0]

        allowed = set(subjects) if subjects else None
        ranked = []
        for idx, score in enumerate(scores):
            chunk = _chunks[idx]
            if allowed and chunk["subject"] not in allowed:
                continue
            if score < MIN_SIMILARITY:
                continue
            ranked.append((float(score), chunk))

        ranked.sort(key=lambda pair: pair[0], reverse=True)

        return [
            {
                "text": chunk["text"],
                "subject": chunk["subject"],
                "topic": chunk["topic"],
                "source": chunk["source"],
                "difficulty": chunk.get("difficulty", "unknown"),
                "score": round(score, 4),
            }
            for score, chunk in ranked[:k]
        ]
    except Exception:
        logger.exception("Retrieval failed; continuing without grounding")
        return []


def format_for_prompt(chunks: List[Dict[str, Any]]) -> str:
    """Render retrieved chunks as a prompt block the agent can cite."""
    if not chunks:
        return ""
    lines = [
        "REFERENCE MATERIAL (use it where relevant; correct it if it conflicts "
        "with what you know to be true):"
    ]
    for i, c in enumerate(chunks, 1):
        lines.append(f"[{i}] ({c['subject']}/{c['topic']}) {c['text']}")
    return "\n".join(lines)


def corpus_stats() -> Dict[str, Any]:
    """Summary for /api/health and the docs."""
    _build_index()
    by_subject: Dict[str, int] = {}
    for c in _chunks:
        by_subject[c["subject"]] = by_subject.get(c["subject"], 0) + 1
    return {
        "available": is_available(),
        "chunks": len(_chunks),
        "by_subject": by_subject,
        "backend": "tfidf-cosine",
    }
