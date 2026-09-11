"""Writes routing decisions to `agent_routing_log` (idea.md sections 1, 3.1).

Person B owns the schema (vision doc section 22 + this table). Until that
table exists in the DB, failures here are swallowed and logged instead of
breaking the /api/chat response - the Agent Trace panel still gets its data
back to the frontend either way; this only affects whether it's persisted.

Expected table shape for schema.sql:

    agent_routing_log(
        id uuid primary key default gen_random_uuid(),
        student_id text,
        conversation_id text,
        message text,
        agent text,
        confidence float,
        used_llm_fallback boolean,
        routed_reason text,
        created_at timestamptz default now()
    )
"""
import logging
from typing import Optional

from sqlalchemy import text as sql_text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import engine

logger = logging.getLogger("learnos.routing_log")

_INSERT = sql_text(
    """
    INSERT INTO agent_routing_log
        (student_id, conversation_id, message, agent, confidence, used_llm_fallback, routed_reason)
    VALUES
        (:student_id, :conversation_id, :message, :agent, :confidence, :used_llm_fallback, :routed_reason)
    """
)


def log_routing(
    student_id: str,
    conversation_id: Optional[str],
    message: str,
    agent: str,
    confidence: float,
    used_llm_fallback: bool,
    routed_reason: str,
) -> None:
    try:
        with engine.begin() as conn:
            conn.execute(
                _INSERT,
                {
                    "student_id": student_id,
                    "conversation_id": conversation_id,
                    "message": message,
                    "agent": agent,
                    "confidence": confidence,
                    "used_llm_fallback": used_llm_fallback,
                    "routed_reason": routed_reason,
                },
            )
    except SQLAlchemyError:
        logger.info(
            "agent_routing_log table not available yet; routing decision only logged here: agent=%s confidence=%.2f",
            agent,
            confidence,
        )
