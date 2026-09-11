"""Coordinator - the entry point for one student turn.

The orchestration itself lives in `graph.py` (LangGraph). This module owns
the agent registry, the image pre-processing that keeps the trained router
usable for photographed questions, and the mapping from graph state to the
/api/chat response contract.

Kept deliberately thin so there is exactly one place where a turn is
executed, and one place where the response shape is built.
"""
import logging
from typing import Any, Dict, List, Optional

from app.agents.aiml_agent import AIMLAgent
from app.agents.base import AgentName
from app.agents.dbms_agent import DBMSAgent
from app.agents.dsa_agent import DSAAgent
from app.agents.general_agent import GeneralAgent
from app.agents.llm_client import extract_question_from_image, parse_data_url
from app.agents.maths_agent import MathsAgent
from app.services import conversation_service
from app.services.trace import TraceRecorder

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
    """Handle one student turn and return the full /api/chat contract."""
    from app.agents.graph import run_graph  # late import keeps startup light

    recorder = TraceRecorder()

    # --- image pre-processing --------------------------------------------
    # The trained router classifies text, so a photographed question is
    # transcribed first and routed on the transcription. That keeps image
    # questions inside the normal routing/trace story instead of dumping
    # them on the General agent.
    image = parse_data_url(image_data_url) if image_data_url else None
    transcribed = ""
    routing_text = message or ""

    if image and len(routing_text.strip()) < 15:
        transcribed = extract_question_from_image(image)
        if transcribed:
            routing_text = f"{message} {transcribed}".strip()

    agent_message = message or ""
    if transcribed:
        agent_message = (
            f"{message}\n\n[Question read from the attached image:]\n{transcribed}".strip()
            if message
            else f"The student attached this question as an image:\n{transcribed}"
        )
    elif image and not message:
        agent_message = "The student attached a question as an image. Read it and answer."

    if conversation_id:
        title = (message or transcribed or "Image question")[:120]
        conversation_service.ensure_conversation(conversation_id, student_id, title=title)

    # --- run the orchestration graph --------------------------------------
    state: Dict[str, Any] = {
        "student_id": student_id,
        "conversation_id": conversation_id,
        "user_message": agent_message,
        "routing_text": routing_text,
        "image": image,
        "recorder": recorder,
        "errors": [],
    }
    result = run_graph(state)

    # --- shape the response ----------------------------------------------
    contributing: List[str] = [r["agent"] for r in result.get("agent_responses", [])]
    routed_reason = result.get("routed_reason", "")
    if transcribed:
        routed_reason += " | routed on text transcribed from the attached image"

    verification = result.get("verification")

    return {
        "agent": result.get("primary_agent", "general"),
        "confidence": result.get("router_confidence", 0.0),
        "routed_reason": routed_reason,
        "response": result.get("final_response", ""),
        "mastery_updates": result.get("mastery_updates", []),
        "recommendation": result.get("recommendation"),
        "contributing_agents": contributing or [result.get("primary_agent", "general")],
        "context_used": {
            "weak_topics": [w["topic"] for w in result.get("weak_topics", [])],
            "prerequisite_gaps": [
                {"prerequisite": g["prerequisite"], "blocks": g["blocks"]}
                for g in result.get("prerequisite_gaps", [])[:3]
            ],
            "recent_messages": 0,
        },
        # New, backwards-compatible explainability fields
        "teaching_strategy": result.get("teaching_strategy"),
        "supporting_agents": result.get("supporting_agents", []),
        "retrieved_context": [
            {"subject": c["subject"], "topic": c["topic"],
             "source": c["source"], "score": c["score"]}
            for c in result.get("retrieved", [])
        ],
        "verification": verification,
        "knowledge_check": result.get("knowledge_check"),
        "trace_events": recorder.dump(),
    }
