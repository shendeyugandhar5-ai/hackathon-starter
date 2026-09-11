"""Coordinator agent - the routing brain (idea.md sections 0.5, 7.2).

Implements the hybrid routing + specialist dispatch + optional cross-agent
collaboration + verifier pass. General is always a leaf node: once routed
there, it answers fully and never hands off in or out.
"""
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
from app.services.routing_log import log_routing

specialists: Dict[AgentName, Any] = {
    "dsa": DSAAgent(),
    "dbms": DBMSAgent(),
    "maths": MathsAgent(),
    "aiml": AIMLAgent(),
    "general": GeneralAgent(),
}


def coordinate(message: str, student_id: str, conversation_id: Optional[str] = None) -> Dict[str, Any]:
    agent, confidence = router_classify(message)
    used_llm_fallback = False
    low_confidence = confidence < settings.ROUTER_CONFIDENCE_THRESHOLD

    if low_confidence and llm_available():
        agent = llm_classify(message)  # LLM fallback - can still choose "general"
        used_llm_fallback = True

    if used_llm_fallback:
        routed_reason = (
            f"Router confidence {confidence:.2f} was below "
            f"{settings.ROUTER_CONFIDENCE_THRESHOLD}; LLM fallback chose '{agent}'"
        )
    elif low_confidence:
        # No LLM configured - keep the trained router's best guess rather than
        # discarding it for something less informed.
        routed_reason = (
            f"Trained router matched '{agent}' with low confidence {confidence:.2f} "
            f"(no LLM configured for fallback)"
        )
    else:
        routed_reason = f"Trained router matched '{agent}' with confidence {confidence:.2f}"

    if agent == "general":
        # Leaf node: General answers fully here. No handoff in or out.
        result = specialists["general"].handle(message, student_id)
        final_text = result.response
    else:
        result, final_text = _handle_specialist(message, student_id, agent)

    log_routing(
        student_id=student_id,
        conversation_id=conversation_id,
        message=message,
        agent=agent,
        confidence=confidence,
        used_llm_fallback=used_llm_fallback,
        routed_reason=routed_reason,
    )

    return {
        "agent": agent,
        "confidence": confidence,
        "routed_reason": routed_reason,
        "response": final_text,
        "mastery_updates": [m.model_dump() for m in result.mastery_updates],
        "recommendation": result.recommendation.model_dump() if result.recommendation else None,
    }


def _handle_specialist(message: str, student_id: str, agent: AgentName) -> Tuple[SpecialistResponse, str]:
    response = specialists[agent].handle(message, student_id)
    answers: List[Tuple[str, str]] = [(agent, response.response)]

    if response.needs_handoff and response.handoff_target and response.handoff_target != "general":
        # Handoff is specialist-to-specialist only - "general" is never a valid handoff target
        handoff_response = specialists[response.handoff_target].handle(message, student_id, context=response)
        answers.append((response.handoff_target, handoff_response.response))
        result = handoff_response
    else:
        collaborators = [a for a in detect_subjects(message) if a != agent][:2]
        for collaborator in collaborators:
            collab_response = specialists[collaborator].handle(message, student_id)
            answers.append((collaborator, collab_response.response))
        result = response

    final_text = verify_and_combine(message, answers) if len(answers) > 1 else answers[0][1]
    return result, final_text
