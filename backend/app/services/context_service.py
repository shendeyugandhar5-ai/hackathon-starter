"""Shared student context - the memory every agent reasons over.

This is what makes LearnOS a *tutor* rather than five independent chatbots:
before any agent answers, the coordinator assembles what the system already
knows about this student and injects it into the agent's prompt.

Assembled from four sources:
  1. student_mastery      - what they're strong/weak at
  2. mistakes             - typed misconceptions they've made before
  3. messages             - recent conversation turns (contextual memory)
  4. student_topic_edges  - prerequisite structure, for root-cause detection

Every read degrades to empty rather than raising, so a cold-start student
(or an unapplied schema) still produces a valid, if sparse, context.
"""
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from sqlalchemy import text as sql_text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import engine

logger = logging.getLogger("learnos.context")

RECENT_MESSAGE_LIMIT = 6
RECENT_MISTAKE_LIMIT = 5


@dataclass
class StudentContext:
    """Everything the system knows about a student at answer time."""

    student_id: str
    name: Optional[str] = None
    goal: Optional[str] = None
    mastery: List[Dict[str, Any]] = field(default_factory=list)
    weak_topics: List[Dict[str, Any]] = field(default_factory=list)
    recent_mistakes: List[Dict[str, Any]] = field(default_factory=list)
    recent_messages: List[Dict[str, Any]] = field(default_factory=list)
    prerequisite_gaps: List[Dict[str, Any]] = field(default_factory=list)
    graph_context: Optional[Dict[str, Any]] = None

    def is_empty(self) -> bool:
        return not (self.mastery or self.recent_messages or self.graph_context)

    def to_prompt_block(self) -> str:
        """Render as a compact block to append to an agent's system prompt.

        Kept terse on purpose - this rides along with every LLM call, so
        verbosity here is paid for on every single request.
        """
        if self.is_empty():
            return (
                "STUDENT CONTEXT: No history yet - this is a new student. "
                "Teach at a standard level and ask a calibrating question if useful."
            )

        lines = ["STUDENT CONTEXT (use this to personalize your answer):"]

        if self.name or self.goal:
            who = self.name or self.student_id
            lines.append(f"- Student: {who}" + (f", goal: {self.goal}" if self.goal else ""))

        if self.weak_topics:
            weak = ", ".join(f"{w['topic']} ({w['score']:.0%})" for w in self.weak_topics[:5])
            lines.append(f"- Weak areas: {weak}")

        strong = [m for m in self.mastery if m["state"] == "mastered"]
        if strong:
            lines.append(f"- Already comfortable with: {', '.join(m['topic'] for m in strong[:5])}")

        if self.prerequisite_gaps:
            gaps = "; ".join(
                f"{g['prerequisite']} ({g['score']:.0%}) gates {g['blocks']}"
                for g in self.prerequisite_gaps[:3]
            )
            lines.append(f"- Prerequisite gaps: {gaps}")

        if self.graph_context and self.graph_context.get("learning_path"):
            path_str = " -> ".join(self.graph_context["learning_path"][:4])
            lines.append(f"- Learning Journey Path: {path_str}")

        if self.recent_mistakes:
            mistakes = ", ".join(
                f"{m['misconception_type']} on {m['topic']}" for m in self.recent_mistakes[:3]
            )
            lines.append(f"- Recent misconceptions: {mistakes}")

        if self.recent_messages:
            lines.append("- Recent conversation:")
            for m in self.recent_messages[-4:]:
                speaker = "Student" if m["role"] == "student" else f"{(m.get('agent') or 'agent').upper()} agent"
                snippet = (m["content"] or "")[:160].replace("\n", " ")
                lines.append(f"    {speaker}: {snippet}")

        return "\n".join(lines)


def _query(sql: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    try:
        with engine.connect() as conn:
            return [dict(r) for r in conn.execute(sql_text(sql), params).mappings().all()]
    except SQLAlchemyError:
        logger.debug("context query unavailable (schema not applied?)")
        return []


def build_context(student_id: str, conversation_id: Optional[str] = None) -> StudentContext:
    """Assemble the full shared context for one student."""
    ctx = StudentContext(student_id=student_id)

    profile = _query("SELECT name, goal FROM students WHERE id = :sid", {"sid": student_id})
    if profile:
        ctx.name = profile[0].get("name")
        ctx.goal = profile[0].get("goal")

    ctx.mastery = _query(
        """
        SELECT subject, topic, score, state, attempts
        FROM student_mastery WHERE student_id = :sid
        ORDER BY score ASC
        """,
        {"sid": student_id},
    )
    ctx.weak_topics = [m for m in ctx.mastery if m["state"] == "weak"]

    ctx.recent_mistakes = _query(
        """
        SELECT topic, subject, misconception_type, created_at
        FROM mistakes WHERE student_id = :sid
        ORDER BY created_at DESC LIMIT :lim
        """,
        {"sid": student_id, "lim": RECENT_MISTAKE_LIMIT},
    )

    if conversation_id:
        rows = _query(
            """
            SELECT role, agent, content FROM messages
            WHERE conversation_id = CAST(:cid AS uuid)
            ORDER BY created_at DESC LIMIT :lim
            """,
            {"cid": conversation_id, "lim": RECENT_MESSAGE_LIMIT},
        )
        ctx.recent_messages = list(reversed(rows))

    ctx.prerequisite_gaps = find_prerequisite_gaps(student_id)
    try:
        from app.services.learning_graph_service import get_learner_graph_context
        ctx.graph_context = get_learner_graph_context(student_id)
    except Exception as err:
        logger.debug(f"Learning graph context load note: {err}")
        ctx.graph_context = None

    return ctx


def find_prerequisite_gaps(student_id: str) -> List[Dict[str, Any]]:
    """Cross-subject root-cause detection.

    Finds topics the student is weak in that are prerequisites for other
    topics they're also struggling with - i.e. fix the prerequisite and the
    dependent improves. This is the query that turns "you're bad at Naive
    Bayes" into "you're bad at Naive Bayes *because* conditional probability
    is at 38%".
    """
    return _query(
        """
        SELECT
            pre.topic        AS prerequisite,
            pre.subject      AS prerequisite_subject,
            pre.score        AS score,
            dep.topic        AS blocks,
            dep.subject      AS blocks_subject,
            dep.score        AS blocked_score,
            e.weight         AS weight
        FROM student_topic_edges e
        JOIN student_mastery pre
          ON pre.student_id = e.student_id AND pre.topic = e.topic_id
        JOIN student_mastery dep
          ON dep.student_id = e.student_id AND dep.topic = e.related_topic_id
        WHERE e.student_id = :sid
          AND e.relationship_type = 'prerequisite_for'
          AND pre.score < 0.55
        ORDER BY pre.score ASC, e.weight DESC
        """,
        {"sid": student_id},
    )
