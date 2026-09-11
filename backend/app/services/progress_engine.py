"""Progress Engine - mastery scoring.

Two tiers, matching the architecture:
  - BKT (Bayesian Knowledge Tracing): interpretable, cold-start friendly,
    needs no training. The default, and what runs at demo time.
  - DKT-LSTM: loaded from ml/dkt/ when trained, used once a student has
    enough interaction history to make it reliable.
"""
import json
import logging
import os
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger("learnos.progress")

# BKT parameters - standard starting values, tunable per subject later
P_LEARN = 0.15   # probability of learning the skill at each opportunity
P_SLIP = 0.10    # probability of answering wrong despite knowing it
P_GUESS = 0.25   # probability of answering right without knowing it

# A student needs at least this many logged interactions before DKT is trusted
DKT_MIN_INTERACTIONS = 15

_DKT_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "dkt"))
_MODEL_PATH = os.path.join(_DKT_DIR, "dkt_model.pt")
_CONFIG_PATH = os.path.join(_DKT_DIR, "dkt_config.json")

_dkt_model = None
_dkt_config: Optional[Dict] = None
_dkt_load_attempted = False


def bkt_update(p_known: float, correct: bool,
               p_learn: float = P_LEARN, p_slip: float = P_SLIP,
               p_guess: float = P_GUESS) -> float:
    """One Bayesian Knowledge Tracing step: posterior given the answer, then learning."""
    if correct:
        numerator = p_known * (1 - p_slip)
        denominator = numerator + (1 - p_known) * p_guess
    else:
        numerator = p_known * p_slip
        denominator = numerator + (1 - p_known) * (1 - p_guess)

    posterior = numerator / denominator if denominator > 0 else p_known
    updated = posterior + (1 - posterior) * p_learn
    return round(min(max(updated, 0.0), 1.0), 4)


def score_to_state(score: float, attempts: int, last_correct: bool) -> str:
    """Qualitative mastery state - easier to read on a dashboard than a percentage."""
    if attempts == 0:
        return "new"
    if score >= 0.75:
        return "mastered"
    if score < 0.45 and attempts >= 3 and not last_correct:
        return "weak"
    if score < 0.35:
        return "weak"
    return "learning"


def _load_dkt() -> bool:
    """Load the trained DKT-LSTM if notebook 02 has produced artifacts."""
    global _dkt_model, _dkt_config, _dkt_load_attempted
    if _dkt_load_attempted:
        return _dkt_model is not None
    _dkt_load_attempted = True

    if not (os.path.exists(_MODEL_PATH) and os.path.exists(_CONFIG_PATH)):
        return False

    try:
        import torch
        import torch.nn as nn

        with open(_CONFIG_PATH, encoding="utf-8") as f:
            config = json.load(f)

        class DKT(nn.Module):
            def __init__(self, num_skills, embed_dim=32, hidden=64):
                super().__init__()
                self.embed = nn.Embedding(num_skills * 2, embed_dim)
                self.lstm = nn.LSTM(embed_dim, hidden, batch_first=True)
                self.dropout = nn.Dropout(0.2)
                self.out = nn.Linear(hidden, num_skills)

            def forward(self, x):
                e = self.embed(x)
                h, _ = self.lstm(e)
                return torch.sigmoid(self.out(self.dropout(h)))

        model = DKT(config["num_skills"], config.get("embed_dim", 32), config.get("hidden", 64))
        model.load_state_dict(torch.load(_MODEL_PATH, map_location="cpu"))
        model.eval()

        _dkt_model, _dkt_config = model, config
        logger.info("Loaded DKT model (val_accuracy=%.3f)", config.get("val_accuracy", 0))
        return True
    except Exception:
        logger.exception("Failed to load DKT model; Progress Engine will use BKT only")
        return False


def dkt_predict(history: List[Tuple[str, bool]]) -> Optional[Dict[str, float]]:
    """Predict mastery across every skill from a student's interaction history.

    history: [(topic_name, was_correct), ...] in chronological order.
    Returns {topic: score} or None when DKT isn't available/reliable yet.
    """
    if len(history) < DKT_MIN_INTERACTIONS or not _load_dkt():
        return None

    try:
        import torch

        skills = _dkt_config["skills"]
        index = {name: i for i, name in enumerate(skills)}

        tokens = [index[t] * 2 + int(c) for t, c in history if t in index]
        if not tokens:
            return None

        with torch.no_grad():
            preds = _dkt_model(torch.tensor([tokens], dtype=torch.long))[0, -1]

        return {skills[i]: round(float(preds[i]), 4) for i in range(len(skills))}
    except Exception:
        logger.exception("DKT prediction failed; falling back to BKT")
        return None


def engine_status() -> Dict[str, object]:
    """What the Progress Engine can currently do - surfaced on /api/health for the demo."""
    dkt_available = _load_dkt()
    return {
        "bkt": True,
        "dkt_available": dkt_available,
        "dkt_min_interactions": DKT_MIN_INTERACTIONS,
        "dkt_val_accuracy": (_dkt_config or {}).get("val_accuracy") if dkt_available else None,
    }
