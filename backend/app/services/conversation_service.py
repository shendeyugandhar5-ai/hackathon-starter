"""Conversation and message persistence.

Without this, chat history dies with the page refresh and the
`conversations` / `messages` tables stay empty. Every /api/chat turn now
writes: the conversation row (once), the student's message, and the
agent's reply.
"""
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import text as sql_text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import engine

logger = logging.getLogger("learnos.conversation")


def ensure_student(student_id: str, name: Optional[str] = None, goal: Optional[str] = None) -> bool:
    """Create the student row if it doesn't exist. Safe to call on every turn."""
    try:
        with engine.begin() as conn:
            conn.execute(
                sql_text(
                    """
                    INSERT INTO students (id, name, goal) VALUES (:sid, :name, :goal)
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {"sid": student_id, "name": name or student_id, "goal": goal},
            )
        return True
    except SQLAlchemyError:
        logger.debug("ensure_student skipped - database unavailable")
        return False


def ensure_conversation(conversation_id: str, student_id: str, title: Optional[str] = None) -> bool:
    """Create the conversation row if absent, so message writes have a parent."""
    try:
        with engine.begin() as conn:
            conn.execute(
                sql_text(
                    """
                    INSERT INTO conversations (id, student_id, title)
                    VALUES (CAST(:cid AS uuid), :sid, :title)
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {"cid": conversation_id, "sid": student_id, "title": (title or "")[:120] or None},
            )
        return True
    except SQLAlchemyError:
        logger.debug("ensure_conversation skipped - database unavailable")
        return False


def save_message(conversation_id: Optional[str], student_id: str, role: str,
                 content: str, agent: Optional[str] = None) -> None:
    """Persist one turn. role is 'student' or 'agent'."""
    try:
        with engine.begin() as conn:
            conn.execute(
                sql_text(
                    """
                    INSERT INTO messages (conversation_id, student_id, role, agent, content)
                    VALUES (CAST(:cid AS uuid), :sid, :role, :agent, :content)
                    """
                ),
                {
                    "cid": conversation_id, "sid": student_id,
                    "role": role, "agent": agent, "content": content,
                },
            )
    except SQLAlchemyError:
        logger.debug("save_message skipped - database unavailable")


def list_conversations(student_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Conversation list with message counts, for a chat sidebar."""
    try:
        with engine.connect() as conn:
            rows = conn.execute(
                sql_text(
                    """
                    SELECT c.id::text AS id,
                           c.title,
                           c.created_at,
                           COUNT(m.id)      AS message_count,
                           MAX(m.created_at) AS last_message_at
                    FROM conversations c
                    LEFT JOIN messages m ON m.conversation_id = c.id
                    WHERE c.student_id = :sid
                    GROUP BY c.id, c.title, c.created_at
                    ORDER BY COALESCE(MAX(m.created_at), c.created_at) DESC
                    LIMIT :lim
                    """
                ),
                {"sid": student_id, "lim": limit},
            ).mappings().all()
            return [dict(r) for r in rows]
    except SQLAlchemyError:
        logger.debug("list_conversations skipped - database unavailable")
        return []
