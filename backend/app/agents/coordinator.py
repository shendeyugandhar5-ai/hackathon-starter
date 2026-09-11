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
from app.services import conversation_service, ocr
from app.services.trace import STEP_OCR, TraceRecorder

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

    # --- image pre-processing: OCR first ----------------------------------
    # Whenever a picture is involved, the text comes out of it before
    # anything else happens. Two reasons, both load-bearing: the chat model
    # we route to is text-only, so the question has to *be* text to be
    # answerable at all; and the trained router classifies text, so
    # extracting it here keeps image questions inside the normal
    # routing/trace story instead of dumping them on the General agent.
    image = parse_data_url(image_data_url) if image_data_url else None
    transcribed = ""
    transcription_source = ""
    ocr_info: Optional[Dict[str, Any]] = None
    routing_text = message or ""

    if image:
        result = ocr.extract_text(image)
        ocr_info = result.as_dict()

        if result.ok:
            transcribed = result.text
            transcription_source = result.engine
            # `confidence` is a named field on the event, so it is dropped
            # from the extra data rather than passed twice.
            extra = {k: v for k, v in ocr_info.items() if k != "confidence"}
            recorder.add(
                STEP_OCR, "OCR text extraction",
                f"Read {len(result.text)} characters across {result.line_count} "
                f"lines using {result.engine}",
                confidence=round(result.confidence, 3), **extra,
            )
        else:
            # Nothing readable - a diagram with no labels, a blurred photo,
            # or no engine installed. A vision-capable model may still manage
            # it; a text-only one will say so, which is honest either way.
            recorder.fail(STEP_OCR, "OCR text extraction",
                          result.error or "no text extracted")
            transcribed = extract_question_from_image(image)
            if transcribed:
                transcription_source = "vision_model"
                recorder.add(STEP_OCR, "Vision model fallback",
                             f"OCR found no text; the vision model read "
                             f"{len(transcribed)} characters instead")

        if transcribed:
            routing_text = f"{message} {transcribed}".strip() if message else transcribed

    # Once the text is out, the image itself is redundant - and sending image
    # parts to a text-only model is an error rather than a graceful
    # degradation. It travels on only when nothing could be read from it.
    llm_image = None if transcribed else image

    agent_message = message or ""
    if transcribed:
        read_by = "OCR" if transcription_source not in ("", "vision_model") else "the vision model"
        agent_message = (
            f"{message}\n\n[Question read from the attached image by {read_by}:]\n{transcribed}".strip()
            if message
            else f"The student attached this question as an image. "
                 f"{read_by.capitalize()} read it as:\n\n{transcribed}"
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
        "image": llm_image,
        "recorder": recorder,
        "errors": [],
    }
    result = run_graph(state)

    # --- shape the response ----------------------------------------------
    contributing: List[str] = [r["agent"] for r in result.get("agent_responses", [])]
    routed_reason = result.get("routed_reason", "")
    if transcribed:
        via = "OCR" if transcription_source not in ("", "vision_model") else "vision model"
        routed_reason += f" | routed on text extracted from the attached image via {via}"

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
        # Null for text-only turns; lets the UI show what was read from an image
        "ocr": ({**ocr_info, "text": transcribed, "source": transcription_source}
                if ocr_info else None),
        "knowledge_check": result.get("knowledge_check"),
        "trace_events": recorder.dump(),
    }
