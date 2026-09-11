"""Database reads/writes for the Student Brain dashboard, Agent Trace panel,
recommendations, and the TEST -> DIAGNOSE -> ADAPT assessment loop.

Every function degrades to an empty/neutral result if the schema isn't
applied yet, so the API stays usable before `database/schema.sql` is run.
"""
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import text as sql_text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import engine
from app.services.progress_engine import bkt_update, score_to_state

logger = logging.getLogger("learnos.student")

# How many failed attempts on one topic before we recommend a human teacher
ESCALATION_ATTEMPT_THRESHOLD = 3
ESCALATION_SCORE_CEILING = 0.4


def _rows(query: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    try:
        with engine.connect() as conn:
            return [dict(r) for r in conn.execute(sql_text(query), params).mappings().all()]
    except SQLAlchemyError:
        logger.info("Query failed (schema may not be applied yet): %s", query.split("\n")[1][:60])
        return []


def get_mastery(student_id: str) -> List[Dict[str, Any]]:
    return _rows(
        """
        SELECT subject, topic, score, state, attempts, source
        FROM student_mastery WHERE student_id = :sid
        ORDER BY subject, score ASC
        """,
        {"sid": student_id},
    )


def get_trace(student_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    return _rows(
        """
        SELECT id::text AS id, message, agent, confidence,
               used_llm_fallback, routed_reason, created_at
        FROM agent_routing_log WHERE student_id = :sid
        ORDER BY created_at DESC LIMIT :lim
        """,
        {"sid": student_id, "lim": limit},
    )


def get_recommendations(student_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    return _rows(
        """
        SELECT id::text AS id, topic, reason, priority, done, created_at
        FROM recommendations WHERE student_id = :sid
        ORDER BY created_at DESC LIMIT :lim
        """,
        {"sid": student_id, "lim": limit},
    )


def get_conversation_messages(conversation_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    return _rows(
        """
        SELECT id::text AS id, role, agent, content, created_at
        FROM messages WHERE conversation_id = CAST(:cid AS uuid)
        ORDER BY created_at ASC LIMIT :lim
        """,
        {"cid": conversation_id, "lim": limit},
    )


def record_assessment(payload: Dict[str, Any]) -> Dict[str, Any]:
    """TEST -> DIAGNOSE -> ADAPT in one transaction.

    Writes the assessment, updates mastery via BKT, logs a typed
    misconception on a wrong answer, and decides whether to escalate
    to a human teacher.
    """
    student_id = payload["student_id"]
    topic = payload.get("topic")
    subject = payload.get("subject")
    is_correct = payload["is_correct"]

    result: Dict[str, Any] = {
        "assessment_id": None,
        "is_correct": is_correct,
        "topic": topic,
        "previous_score": None,
        "new_score": None,
        "state": None,
        "misconception_logged": None,
        "escalate_to_human": False,
        "escalation_reason": None,
    }

    try:
        with engine.begin() as conn:
            row = conn.execute(
                sql_text(
                    """
                    INSERT INTO assessments
                        (student_id, conversation_id, subject, topic, question,
                         expected_answer, student_answer, is_correct, confidence_rating)
                    VALUES
                        (:student_id, :conversation_id, :subject, :topic, :question,
                         :expected_answer, :student_answer, :is_correct, :confidence_rating)
                    RETURNING id::text AS id
                    """
                ),
                {
                    "student_id": student_id,
                    "conversation_id": payload.get("conversation_id"),
                    "subject": subject,
                    "topic": topic,
                    "question": payload["question"],
                    "expected_answer": payload.get("expected_answer"),
                    "student_answer": payload["student_answer"],
                    "is_correct": is_correct,
                    "confidence_rating": payload.get("confidence_rating"),
                },
            ).mappings().first()
            result["assessment_id"] = row["id"] if row else None

            if not is_correct and payload.get("misconception_type"):
                conn.execute(
                    sql_text(
                        """
                        INSERT INTO mistakes (student_id, subject, topic, misconception_type, description)
                        VALUES (:sid, :subject, :topic, :mtype, :desc)
                        """
                    ),
                    {
                        "sid": student_id,
                        "subject": subject,
                        "topic": topic,
                        "mtype": payload["misconception_type"],
                        "desc": payload.get("student_answer"),
                    },
                )
                result["misconception_logged"] = payload["misconception_type"]

            if topic and subject:
                current = conn.execute(
                    sql_text(
                        """
                        SELECT score, attempts FROM student_mastery
                        WHERE student_id = :sid AND subject = :subject AND topic = :topic
                        """
                    ),
                    {"sid": student_id, "subject": subject, "topic": topic},
                ).mappings().first()

                prev_score = float(current["score"]) if current else 0.2
                attempts = (int(current["attempts"]) if current else 0) + 1

                new_score = bkt_update(prev_score, is_correct)
                state = score_to_state(new_score, attempts, is_correct)

                conn.execute(
                    sql_text(
                        """
                        INSERT INTO student_mastery
                            (student_id, subject, topic, score, state, attempts, source, updated_at)
                        VALUES (:sid, :subject, :topic, :score, :state, :attempts, 'bkt', now())
                        ON CONFLICT (student_id, subject, topic) DO UPDATE
                        SET score = EXCLUDED.score,
                            state = EXCLUDED.state,
                            attempts = EXCLUDED.attempts,
                            updated_at = now()
                        """
                    ),
                    {
                        "sid": student_id, "subject": subject, "topic": topic,
                        "score": new_score, "state": state, "attempts": attempts,
                    },
                )

                result.update(previous_score=prev_score, new_score=new_score, state=state)

                # Human escalation - bounded autonomy
                fails = conn.execute(
                    sql_text(
                        """
                        SELECT count(*) AS c FROM assessments
                        WHERE student_id = :sid AND topic = :topic AND is_correct = FALSE
                        """
                    ),
                    {"sid": student_id, "topic": topic},
                ).scalar() or 0

                if fails >= ESCALATION_ATTEMPT_THRESHOLD and new_score < ESCALATION_SCORE_CEILING:
                    result["escalate_to_human"] = True
                    result["escalation_reason"] = (
                        f"{fails} incorrect attempts on '{topic}' with mastery still at "
                        f"{new_score:.0%} - a teacher may help more than another explanation."
                    )

    except SQLAlchemyError as e:
        # Expected before database/schema.sql is applied - keep it quiet,
        # the caller sees the unchanged (None) mastery fields either way.
        logger.info("record_assessment skipped - database unavailable: %s",
                    str(e).split("\n")[0][:120])

    return result
