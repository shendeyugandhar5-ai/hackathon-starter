"""Tier-1 subject router (idea.md section 3.1) plus multi-subject detection
for cross-agent collaboration (idea.md sections 0.5, 14).

Hybrid routing: a trained TF-IDF + Logistic Regression classifier - owned
by Person C, artifacts dropped in ml/router/*.joblib - gives fast,
deterministic first-pass routing. Until those artifacts exist, or when the
model is unsure, this falls back to a keyword heuristic; the coordinator
falls back further to the LLM below ROUTER_CONFIDENCE_THRESHOLD.
"""
import logging
import os
from typing import Dict, List, Tuple

from app.agents.base import AgentName
from app.agents.llm_client import complete
from app.agents.prompts import ROUTER_SYSTEM_PROMPT

logger = logging.getLogger("learnos.router")

_ML_ROUTER_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "router")
)
_VECTORIZER_PATH = os.path.join(_ML_ROUTER_DIR, "router_vectorizer.joblib")
_CLASSIFIER_PATH = os.path.join(_ML_ROUTER_DIR, "router_classifier.joblib")

_vectorizer = None
_classifier = None
_model_load_attempted = False

# Keyword fallback + multi-subject detection signal. Not a replacement for
# the trained classifier - just enough to keep routing functional before
# Person C's model lands, and to flag likely cross-agent questions either way.
_KEYWORDS: Dict[AgentName, List[str]] = {
    "dsa": [
        "array", "linked list", "recursion", "sort", "stack", "queue", "tree",
        "graph", "complexity", "big o", "leetcode", "algorithm", "pointer",
    ],
    "dbms": [
        "sql", "query", "database", "normalization", "join", "schema",
        "index", "transaction", "er diagram", "table",
    ],
    "maths": [
        "probability", "calculus", "derivative", "integral", "matrix",
        "linear algebra", "statistics", "bayes", "combinatorics",
    ],
    "aiml": [
        "model", "neural network", "gradient descent", "training",
        "overfitting", "regression", "classification", "loss function",
        "machine learning", "deep learning",
    ],
}


def _load_trained_model() -> None:
    global _vectorizer, _classifier, _model_load_attempted
    if _model_load_attempted:
        return
    _model_load_attempted = True

    if not (os.path.exists(_VECTORIZER_PATH) and os.path.exists(_CLASSIFIER_PATH)):
        return
    try:
        import joblib

        _vectorizer = joblib.load(_VECTORIZER_PATH)
        _classifier = joblib.load(_CLASSIFIER_PATH)
        logger.info("Loaded trained router classifier from ml/router/")
    except Exception:
        logger.exception("Failed to load trained router classifier; using keyword fallback")
        _vectorizer = None
        _classifier = None


def _subject_scores(message: str) -> Dict[AgentName, int]:
    text = message.lower()
    return {agent: sum(1 for kw in keywords if kw in text) for agent, keywords in _KEYWORDS.items()}


def _keyword_classify(message: str) -> Tuple[AgentName, float]:
    scores = _subject_scores(message)
    best_agent = max(scores, key=scores.get)
    if scores[best_agent] == 0:
        return "general", 0.4
    confidence = min(0.9, 0.5 + 0.15 * scores[best_agent])
    return best_agent, confidence


def router_classify(message: str) -> Tuple[AgentName, float]:
    """Tier-1 classification. Returns (agent, confidence in [0, 1])."""
    _load_trained_model()
    if _vectorizer is not None and _classifier is not None:
        probs = _classifier.predict_proba(_vectorizer.transform([message]))[0]
        best_idx = probs.argmax()
        return _classifier.classes_[best_idx], float(probs[best_idx])
    return _keyword_classify(message)


def llm_classify(message: str) -> AgentName:
    """LLM fallback classifier for messages the trained/keyword router is unsure about."""
    raw = complete(ROUTER_SYSTEM_PROMPT, message, max_tokens=10).strip().lower()
    for agent in ("dsa", "dbms", "maths", "aiml", "general"):
        if agent in raw:
            return agent
    return "general"


def detect_subjects(message: str, max_subjects: int = 3) -> List[AgentName]:
    """Which subjects this message plausibly touches, most relevant first.

    Used by the coordinator to decide whether a question needs more than
    one specialist (idea.md section 14 examples, e.g. "why does gradient
    descent use calculus" -> Maths + AIML + DSA).
    """
    scores = _subject_scores(message)
    hits = [agent for agent, score in scores.items() if score > 0]
    hits.sort(key=lambda agent: scores[agent], reverse=True)
    return hits[:max_subjects]
