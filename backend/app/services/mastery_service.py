"""Reads student mastery data directly from the database.

Used only by the General agent (idea.md section 0.5) so it can build a
placement roadmap without forwarding the live question to a specialist
mid-turn. The `student_mastery` table is owned by Person B (backend/DB) -
schema.sql should add it per idea.md section 1/section 22:

    student_mastery(student_id text, subject text, topic text, score float)

Until that table exists this returns an empty list so callers degrade
gracefully instead of crashing.
"""
import logging
from typing import Any, Dict, List

from sqlalchemy import text as sql_text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import engine

logger = logging.getLogger("learnos.mastery")


def get_mastery_snapshot(student_id: str) -> List[Dict[str, Any]]:
    query = sql_text(
        "SELECT subject, topic, score FROM student_mastery WHERE student_id = :student_id"
    )
    try:
        with engine.connect() as conn:
            rows = conn.execute(query, {"student_id": student_id}).mappings().all()
            return [dict(row) for row in rows]
    except SQLAlchemyError:
        logger.debug("student_mastery table not available yet; returning empty mastery snapshot")
        return []
