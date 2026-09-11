"""Coordinator agent - the routing brain.

One /api/chat turn, end to end:

    UNDERSTAND  build shared student context from the database
    ROUTE       trained Tier-1 classifier, LLM fallback below threshold
    EXPLAIN WHY record agent + confidence + reason for the Agent Trace panel
    COLLABORATE dispatch to one or more specialists (General is a leaf node)
    VERIFY      combine multi-agent answers through the verifier
    REMEMBER    persist the student and agent messages
    RECOMMEND   derive the next-best-action from the updated context
"""
import logging
from typing import Any, Dict, List, Optional, Tuple

from app.agents.aiml_agent import AIMLAgent
from app.agents.base import AgentName, SpecialistResponse
from app.agents.dbms_agent import DBMSAgent
from app.agents.dsa_agent import DSAAgent
from app.agents.general_agent import GeneralAgent
from app.agents.llm_client import is_available as llm_available
from app.agents.maths_agent import MathsAgent
from app.agents.router import detect_subjects, llm_classify, router_classify
from app.agents.verifier_agent import verify_and_combine
from app.core.config import settings
from app.services import conversation_service
from app.services.context_service import build_context
from app.services.recommendation_engine import (
    derive_recommendations,
    persist_recommendations,
    top_recommendation,
)
from app.services.routing_log import log_routing

logger = logging.getLogger("learnos.coordinator")

specialists: Dict[AgentName, Any] = {
    "dsa": DSAAgent(),
    "dbms": DBMSAgent(),
    "maths": MathsAgent(),
    "aiml": AIMLAgent(),
    "general": GeneralAgent(),
}

# Agent metadata, surfaced by GET /api/agents for the UI
AGENT_PROFILES: Dict[str, Dict[str, str]] = {
    "dsa": {"label": "DSA Agent",
            "scope": "Data structures, algorithms, complexity, debugging"},
    "dbms": {"label": "DBMS Agent",
             "scope": "SQL, normalization, ER modeling, transactions, indexing"},
    "maths": {"label": "Maths Agent",
              "scope": "Algebra, calculus, linear algebra, probability, statistics"},
    "aiml": {"label": "AIML Agent",
             "scope": "ML/DL concepts, model behavior, training dynamics"},
    "general": {"label": "General Agent",
                "scope": "Interview prep, roadmaps, motivation, low-confidence fallback"},
}


def coordinate(message: str, student_id: str,
               conversation_id: Optional[str] = None) -> Dict[str, Any]:
    """Handle one student turn and return the full /api/chat contract."""

    # --- UNDERSTAND: assemble everything we know about this student --------
    conversation_service.ensure_student(student_id)
    if conversation_id:
        conversation_service.ensure_conversation(conversation_id, student_id, title=message)

    ctx = build_context(student_id, conversation_id)
    context_block = ctx.to_prompt_block()

    # --- ROUTE ------------------------------------------------------------
    agent, confidence = router_classify(message)
    used_llm_fallback = False
    low_confidence = confidence < settings.ROUTER_CONFIDENCE_THRESHOLD

    if low_confidence and llm_available():
        agent = llm_classify(message)
        used_llm_fallback = True

    if used_llm_fallback:
        routed_reason = (
            f"Router confidence {confidence:.2f} was below "
            f"{settings.ROUTER_CONFIDENCE_THRESHOLD}; LLM fallback chose '{agent}'"
        )
    elif low_confidence:
        routed_reason = (
            f"Trained router matched '{agent}' with low confidence {confidence:.2f} "
            f"(no LLM configured for fallback)"
        )
    else:
        routed_reason = f"Trained router matched '{agent}' with confidence {confidence:.2f}"

    # Personalization signal: mention when context steered the teaching
    if ctx.weak_topics:
        weak_names = {w["topic"] for w in ctx.weak_topics}
        routed_reason += f" | personalized using {len(weak_names)} known weak topic(s)"

    # --- COLLABORATE + VERIFY --------------------------------------------
    if agent == "general":
        # Leaf node: General answers fully here. No handoff in or out.
        result = specialists["general"].handle(message, student_id, student_context=context_block)
        final_text = result.response
        contributing = ["general"]
    else:
        result, final_text, contributing = _handle_specialist(
            message, student_id, agent, context_block
        )

    # --- EXPLAIN WHY: persist the routing decision for the trace panel -----
    log_routing(
        student_id=student_id,
        conversation_id=conversation_id,
        message=message,
        agent=agent,
        confidence=confidence,
        used_llm_fallback=used_llm_fallback,
        routed_reason=routed_reason,
    )

    # --- REMEMBER ---------------------------------------------------------
    if conversation_id:
        conversation_service.save_message(conversation_id, student_id, "student", message)
        conversation_service.save_message(conversation_id, student_id, "agent", final_text, agent=agent)

    # --- RECOMMEND --------------------------------------------------------
    recommendation = result.recommendation.model_dump() if result.recommendation else None
    if recommendation is None:
        recommendation = top_recommendation(ctx)
    persist_recommendations(student_id, derive_recommendations(ctx))

    return {
        "agent": agent,
        "confidence": confidence,
        "routed_reason": routed_reason,
        "response": final_text,
        "mastery_updates": [m.model_dump() for m in result.mastery_updates],
        "recommendation": recommendation,
        "contributing_agents": contributing,
        "context_used": {
            "weak_topics": [w["topic"] for w in ctx.weak_topics],
            "prerequisite_gaps": [
                {"prerequisite": g["prerequisite"], "blocks": g["blocks"]}
                for g in ctx.prerequisite_gaps[:3]
            ],
            "recent_messages": len(ctx.recent_messages),
        },
    }


def _handle_specialist(message: str, student_id: str, agent: AgentName,
                       context_block: str) -> Tuple[SpecialistResponse, str, List[str]]:
    """Dispatch to a specialist, pulling in collaborators when the question spans subjects."""
    response = specialists[agent].handle(message, student_id, student_context=context_block)
    answers: List[Tuple[str, str]] = [(agent, response.response)]

    if response.needs_handoff and response.handoff_target and response.handoff_target != "general":
        # Handoff is specialist-to-specialist only
        handoff = specialists[response.handoff_target].handle(
            message, student_id, context=response, student_context=context_block
        )
        answers.append((response.handoff_target, handoff.response))
        result = handoff
    else:
        collaborators = [a for a in detect_subjects(message) if a != agent][:2]
        for collaborator in collaborators:
            collab = specialists[collaborator].handle(
                message, student_id, student_context=context_block
            )
            answers.append((collaborator, collab.response))
        result = response

    final_text = verify_and_combine(message, answers) if len(answers) > 1 else answers[0][1]
    return result, final_text, [name for name, _ in answers]
