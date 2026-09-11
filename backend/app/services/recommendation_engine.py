"""Personalized next-best-action recommendations.

Rule-based and deterministic on purpose: a judge can ask "why did it
recommend that?" and get a precise answer, which an LLM-generated
suggestion cannot give. Priority order:

  1. Prerequisite gaps  - fixing the root cause lifts everything downstream
  2. Weak topics        - lowest mastery first
  3. Stalled topics     - many attempts, still not mastered
"""
import logging
from typing import Any, Dict, List

from sqlalchemy import text as sql_text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import engine
from app.services.context_service import StudentContext

logger = logging.getLogger("learnos.recommendations")

STALLED_ATTEMPT_THRESHOLD = 4
MASTERED_THRESHOLD = 0.75


def derive_recommendations(ctx: StudentContext, limit: int = 5) -> List[Dict[str, Any]]:
    """Compute recommendations from the student's current context."""
    recs: List[Dict[str, Any]] = []
    seen = set()

    # 1. Prerequisite gaps - highest leverage
    for gap in ctx.prerequisite_gaps:
        topic = gap["prerequisite"]
        if topic in seen:
            continue
        seen.add(topic)
        recs.append({
            "topic": topic,
            "reason": (
                f"Root cause: {topic} is at {gap['score']:.0%} and it gates "
                f"{gap['blocks']} ({gap['blocked_score']:.0%}). Fixing this lifts both."
            ),
            "priority": "high",
        })

    # 2. Weak topics, weakest first
    for weak in ctx.weak_topics:
        topic = weak["topic"]
        if topic in seen:
            continue
        seen.add(topic)
        recs.append({
            "topic": topic,
            "reason": (
                f"{weak['subject'].upper()} weak spot at {weak['score']:.0%} "
                f"after {weak['attempts']} attempts."
            ),
            "priority": "high" if weak["score"] < 0.35 else "medium",
        })

    # 3. Stalled topics - lots of practice, still not landing
    for m in ctx.mastery:
        topic = m["topic"]
        if topic in seen or m["state"] == "mastered":
            continue
        if m["attempts"] >= STALLED_ATTEMPT_THRESHOLD and m["score"] < MASTERED_THRESHOLD:
            seen.add(topic)
            recs.append({
                "topic": topic,
                "reason": (
                    f"Stalled: {m['attempts']} attempts but still at {m['score']:.0%}. "
                    f"Try a different explanation style."
                ),
                "priority": "medium",
            })

    return recs[:limit]


def persist_recommendations(student_id: str, recs: List[Dict[str, Any]]) -> None:
    """Upsert recommendations so the dashboard reflects the latest state."""
    if not recs:
        return
    try:
        with engine.begin() as conn:
            for rec in recs:
                conn.execute(
                    sql_text(
                        """
                        INSERT INTO recommendations (student_id, topic, reason, priority)
                        VALUES (:sid, :topic, :reason, :priority)
                        ON CONFLICT (student_id, topic) DO UPDATE
                        SET reason = EXCLUDED.reason,
                            priority = EXCLUDED.priority,
                            done = FALSE,
                            created_at = now()
                        """
                    ),
                    {
                        "sid": student_id, "topic": rec["topic"],
                        "reason": rec["reason"], "priority": rec["priority"],
                    },
                )
    except SQLAlchemyError:
        logger.debug("persist_recommendations skipped - database unavailable")


def top_recommendation(ctx: StudentContext) -> Dict[str, Any] | None:
    """The single next-best-action to attach to a chat response."""
    recs = derive_recommendations(ctx, limit=1)
    return recs[0] if recs else None
