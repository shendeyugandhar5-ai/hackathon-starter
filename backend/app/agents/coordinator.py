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
from app.agents.llm_client import extract_question_from_image, parse_data_url
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
               conversation_id: Optional[str] = None,
               image_data_url: Optional[str] = None) -> Dict[str, Any]:
    """Handle one student turn and return the full /api/chat contract.

    `image_data_url` carries a photographed/screenshotted question. Because
    the trained router classifies *text*, an image with little or no
    accompanying text is transcribed first and routed on the transcription -
    so image questions keep a real confidence score and Agent Trace entry
    instead of silently falling through to the General agent.
    """

    # --- UNDERSTAND: assemble everything we know about this student --------
    conversation_service.ensure_student(student_id)

    image = parse_data_url(image_data_url) if image_data_url else None
    transcribed = ""
    routing_text = message or ""

    if image and len(routing_text.strip()) < 15:
        # Too little text to route on - read the question out of the image
        transcribed = extract_question_from_image(image)
        if transcribed:
            routing_text = f"{message} {transcribed}".strip()

    title = (message or transcribed or "Image question")[:120]
    if conversation_id:
        conversation_service.ensure_conversation(conversation_id, student_id, title=title)

    ctx = build_context(student_id, conversation_id)
    context_block = ctx.to_prompt_block()

    # What the specialist actually sees: the student's words plus, when the
    # question lives in the image, the transcription for grounding.
    agent_message = message or ""
    if transcribed:
        agent_message = (
            f"{message}\n\n[Question read from the attached image:]\n{transcribed}".strip()
            if message
            else f"The student attached this question as an image:\n{transcribed}"
        )
    elif image and not message:
        agent_message = "The student attached a question as an image. Read it and answer."

    # --- ROUTE ------------------------------------------------------------
    agent, confidence = router_classify(routing_text)
    used_llm_fallback = False
    low_confidence = confidence < settings.ROUTER_CONFIDENCE_THRESHOLD

    if low_confidence and llm_available():
        agent = llm_classify(routing_text)
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

    if transcribed:
        routed_reason += " | routed on text transcribed from the attached image"

    # Personalization signal: mention when context steered the teaching
    if ctx.weak_topics:
        weak_names = {w["topic"] for w in ctx.weak_topics}
        routed_reason += f" | personalized using {len(weak_names)} known weak topic(s)"

    # --- COLLABORATE + VERIFY --------------------------------------------
    if agent == "general":
        # Leaf node: General answers fully here. No handoff in or out.
        result = specialists["general"].handle(
            agent_message, student_id, student_context=context_block, image=image
        )
        final_text = result.response
        contributing = ["general"]
    else:
        result, final_text, contributing = _handle_specialist(
            agent_message, student_id, agent, context_block, image=image, routing_text=routing_text
        )

    # --- EXPLAIN WHY: persist the routing decision for the trace panel -----
    log_routing(
        student_id=student_id,
        conversation_id=conversation_id,
        message=routing_text or "[image question]",
        agent=agent,
        confidence=confidence,
        used_llm_fallback=used_llm_fallback,
        routed_reason=routed_reason,
    )

    # --- REMEMBER ---------------------------------------------------------
    # Store the transcription rather than the base64 image: it keeps the
    # thread readable and keeps multi-turn context cheap.
    if conversation_id:
        stored = message or ""
        if image:
            stored = (f"{stored}\n[image attached]" if stored else "[image attached]")
            if transcribed:
                stored += f"\n{transcribed}"
        conversation_service.save_message(conversation_id, student_id, "student", stored.strip())
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
                       context_block: str, image: Optional[dict] = None,
                       routing_text: Optional[str] = None
                       ) -> Tuple[SpecialistResponse, str, List[str]]:
    """Dispatch to a specialist, pulling in collaborators when the question spans subjects."""
    response = specialists[agent].handle(
        message, student_id, student_context=context_block, image=image
    )
    answers: List[Tuple[str, str]] = [(agent, response.response)]

    if response.needs_handoff and response.handoff_target and response.handoff_target != "general":
        # Handoff is specialist-to-specialist only
        handoff = specialists[response.handoff_target].handle(
            message, student_id, context=response, student_context=context_block, image=image
        )
        answers.append((response.handoff_target, handoff.response))
        result = handoff
    else:
        # Collaboration is decided on the routing text, which for an image
        # question is the transcription rather than the (empty) message.
        collaborators = [a for a in detect_subjects(routing_text or message) if a != agent][:2]
        for collaborator in collaborators:
            collab = specialists[collaborator].handle(
                message, student_id, student_context=context_block, image=image
            )
            answers.append((collaborator, collab.response))
        result = response

    final_text = verify_and_combine(message, answers) if len(answers) > 1 else answers[0][1]
    return result, final_text, [name for name, _ in answers]
