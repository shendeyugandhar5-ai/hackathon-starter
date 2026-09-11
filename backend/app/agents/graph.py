"""EduHive orchestration graph (LangGraph).

The stateful pipeline that turns one student message into a taught,
verified, personalized answer. Each node does one job and appends to the
trace, so the Agent Trace panel is a literal record of execution.

    ingest_request
         v
    router_result          existing trained TF-IDF classifier (kept)
         v
    load_student_context   mastery, misconceptions, prerequisite gaps
         v
    coordinator_decision   agents, strategy, whether to ground/verify/quiz
         v
    retrieve_knowledge     subject-filtered RAG           (conditional)
         v
    execute_specialists    primary + supporting agents
         v
    verifier               structured verdict, <=1 correction (conditional)
         v
    knowledge_check        generated quiz question        (conditional)
         v
    update_mastery         persists + recommendation
         v
    finalize_response

Conditional edges mean a simple DSA question does NOT pay for retrieval,
verification, and quiz generation - the coordinator decides.

LangGraph is optional at runtime: if the import fails, `run_graph` falls
back to executing the same nodes in sequence, so /api/chat never breaks
because of an orchestration dependency.
"""
import logging
from typing import Any, Dict, List, Optional, TypedDict

from app.agents import decision as decision_policy
from app.agents.base import AgentName
from app.agents.language import language_directive
from app.agents.llm_client import complete, is_real_answer
from app.agents.llm_client import is_available as llm_available
from app.agents.router import llm_classify, router_classify
from app.agents.verifier_agent import combine_answers, correct, verify
from app.core.config import settings
from app.knowledge import retriever
from app.services import conversation_service, trace as trace_mod
from app.services.context_service import build_context
from app.services.recommendation_engine import (
    derive_recommendations,
    persist_recommendations,
    top_recommendation,
)
from app.services.routing_log import log_routing
from app.services.trace import TraceRecorder

logger = logging.getLogger("learnos.graph")

# Subject label for retrieval/quiz targeting per agent
AGENT_LABELS = {
    "dsa": "DSA", "dbms": "DBMS", "maths": "Maths",
    "aiml": "AIML", "general": "General",
}


class EduHiveState(TypedDict, total=False):
    """State threaded through every node."""
    # inputs
    student_id: str
    conversation_id: Optional[str]
    user_message: str          # what the agent is asked
    routing_text: str          # what the router classifies (image transcription aware)
    image: Optional[dict]
    language: Optional[str]   # answer language ('hi', 'mr', ...); None = English

    # routing
    primary_agent: AgentName
    router_confidence: float
    used_llm_fallback: bool
    routed_reason: str

    # context
    student_context_block: str
    mastery: List[Dict[str, Any]]
    weak_topics: List[Dict[str, Any]]
    prerequisite_gaps: List[Dict[str, Any]]

    # plan
    supporting_agents: List[AgentName]
    teaching_strategy: str
    use_rag: bool
    needs_verification: bool
    needs_knowledge_check: bool

    # execution
    retrieved: List[Dict[str, Any]]
    agent_responses: List[Dict[str, str]]
    final_response: str
    verification: Optional[Dict[str, Any]]
    knowledge_check: Optional[Dict[str, Any]]
    mastery_updates: List[Dict[str, Any]]
    recommendation: Optional[Dict[str, Any]]

    # observability
    recorder: Any
    errors: List[str]


# --------------------------------------------------------------- nodes ---

def ingest_request(state: EduHiveState) -> EduHiveState:
    rec: TraceRecorder = state["recorder"]
    message = state.get("routing_text") or state.get("user_message") or ""
    rec.add(trace_mod.STEP_QUERY_RECEIVED, "Query received",
            message[:160] or "[image question]")
    conversation_service.ensure_student(state["student_id"])
    return state


def router_result(state: EduHiveState) -> EduHiveState:
    """Stage 1: the existing trained classifier. Kept, and kept visible."""
    rec: TraceRecorder = state["recorder"]
    text = state.get("routing_text") or state.get("user_message") or ""

    agent, confidence = router_classify(text)
    used_llm_fallback = False
    low_confidence = confidence < settings.ROUTER_CONFIDENCE_THRESHOLD

    if low_confidence and llm_available():
        # Only accept the fallback if it actually classified something;
        # otherwise keep the trained router's pick rather than degrading it.
        llm_pick = llm_classify(text)
        if llm_pick:
            agent = llm_pick
            used_llm_fallback = True

    if used_llm_fallback:
        reason = (f"Router confidence {confidence:.2f} below "
                  f"{settings.ROUTER_CONFIDENCE_THRESHOLD}; LLM fallback chose '{agent}'")
    elif low_confidence:
        reason = (f"Trained router matched '{agent}' with low confidence "
                  f"{confidence:.2f}; kept it (LLM fallback unavailable)")
    else:
        reason = f"Trained router matched '{agent}' with confidence {confidence:.2f}"

    # ASCII label: Windows consoles default to cp1252 and choke on arrows
    rec.add(trace_mod.STEP_ROUTER,
            f"ML Router -> {AGENT_LABELS.get(agent, agent)}",
            reason, agent=agent, confidence=round(confidence, 4),
            used_llm_fallback=used_llm_fallback)

    state.update(primary_agent=agent, router_confidence=confidence,
                 used_llm_fallback=used_llm_fallback, routed_reason=reason)
    return state


def load_student_context(state: EduHiveState) -> EduHiveState:
    rec: TraceRecorder = state["recorder"]
    ctx = build_context(state["student_id"], state.get("conversation_id"))

    if ctx.is_empty():
        rec.skip(trace_mod.STEP_STUDENT_CONTEXT, "Student Brain",
                 "no learning history yet - teaching at a standard level")
    else:
        weak = ", ".join(w["topic"].replace("_", " ") for w in ctx.weak_topics[:3])
        rec.add(trace_mod.STEP_STUDENT_CONTEXT, "Student Brain",
                f"{len(ctx.mastery)} topics tracked"
                + (f"; weak in {weak}" if weak else ""),
                weak_topics=[w["topic"] for w in ctx.weak_topics],
                prerequisite_gaps=[
                    {"prerequisite": g["prerequisite"], "blocks": g["blocks"]}
                    for g in ctx.prerequisite_gaps[:3]
                ],
                recent_messages=len(ctx.recent_messages))

    state.update(student_context_block=ctx.to_prompt_block(),
                 mastery=ctx.mastery, weak_topics=ctx.weak_topics,
                 prerequisite_gaps=ctx.prerequisite_gaps)
    return state


def coordinator_decision(state: EduHiveState) -> EduHiveState:
    """The hive's brain: who teaches, how, and which stages to run."""
    rec: TraceRecorder = state["recorder"]

    plan = decision_policy.decide(
        message=state.get("routing_text") or state.get("user_message", ""),
        routed_agent=state["primary_agent"],
        confidence=state["router_confidence"],
        mastery=state.get("mastery", []),
        weak_topics=state.get("weak_topics", []),
    )

    supporting_labels = [AGENT_LABELS.get(a, a) for a in plan.supporting_agents]
    rec.add(trace_mod.STEP_COORDINATOR, "Coordinator decision",
            plan.rationale,
            agent=plan.primary_agent,
            primary=AGENT_LABELS.get(plan.primary_agent, plan.primary_agent),
            supporting=supporting_labels,
            teaching_strategy=plan.teaching_strategy,
            strategy_reason=plan.strategy_reason,
            will_retrieve=plan.use_rag,
            will_verify=plan.needs_verification)

    state.update(supporting_agents=plan.supporting_agents,
                 teaching_strategy=plan.teaching_strategy,
                 use_rag=plan.use_rag,
                 needs_verification=plan.needs_verification,
                 needs_knowledge_check=plan.needs_knowledge_check)
    state["routed_reason"] += f" | strategy: {plan.teaching_strategy}"
    return state


def retrieve_knowledge(state: EduHiveState) -> EduHiveState:
    """Subject-filtered RAG: only the relevant subjects' material."""
    rec: TraceRecorder = state["recorder"]

    if not state.get("use_rag"):
        rec.skip(trace_mod.STEP_RAG, "Knowledge retrieval",
                 "coordinator judged grounding unnecessary for this message")
        state["retrieved"] = []
        return state

    subjects = [state["primary_agent"]] + list(state.get("supporting_agents", []))
    chunks = retriever.retrieve(
        state.get("routing_text") or state.get("user_message", ""),
        subjects=subjects, k=3,
    )

    if chunks:
        sources = ", ".join(f"{c['subject']}/{c['topic']}" for c in chunks)
        rec.add(trace_mod.STEP_RAG, f"Retrieved {len(chunks)} knowledge chunk(s)",
                sources, chunks=[
                    {"subject": c["subject"], "topic": c["topic"],
                     "source": c["source"], "score": c["score"]} for c in chunks
                ], subjects=subjects)
    else:
        rec.skip(trace_mod.STEP_RAG, "Knowledge retrieval",
                 f"no material above relevance threshold in {', '.join(subjects)}")

    state["retrieved"] = chunks
    return state


def execute_specialists(state: EduHiveState) -> EduHiveState:
    """Run the primary agent, plus supporting agents when the plan calls for it."""
    from app.agents.coordinator import specialists  # late import avoids a cycle

    rec: TraceRecorder = state["recorder"]
    grounding = retriever.format_for_prompt(state.get("retrieved", []))
    strategy = state.get("teaching_strategy", "step_by_step")

    context_block = state.get("student_context_block", "")
    if grounding:
        context_block = f"{context_block}\n\n{grounding}"
    context_block += (
        f"\n\nTEACHING STRATEGY: answer using the '{strategy}' approach."
    )

    responses: List[Dict[str, str]] = []
    for agent_name in [state["primary_agent"]] + list(state.get("supporting_agents", [])):
        agent = specialists.get(agent_name)
        if agent is None:
            continue
        try:
            result = agent.handle(
                state["user_message"], state["student_id"],
                student_context=context_block, image=state.get("image"),
                language=state.get("language"),
            )
            responses.append({"agent": agent_name, "response": result.response})
            role = "primary" if agent_name == state["primary_agent"] else "supporting"
            rec.add(trace_mod.STEP_SPECIALIST,
                    f"{AGENT_LABELS.get(agent_name, agent_name)} Agent responded",
                    f"{role}; {len(result.response)} chars", agent=agent_name, role=role)
        except Exception as exc:
            logger.exception("Specialist %s failed", agent_name)
            rec.fail(trace_mod.STEP_SPECIALIST,
                     f"{AGENT_LABELS.get(agent_name, agent_name)} Agent failed", str(exc)[:120])
            state.setdefault("errors", []).append(f"{agent_name}: {exc}")

    state["agent_responses"] = responses

    if len(responses) > 1:
        rec.add(trace_mod.STEP_COLLABORATION, "Agents collaborated",
                " + ".join(AGENT_LABELS.get(r["agent"], r["agent"]) for r in responses),
                agents=[r["agent"] for r in responses])
        state["final_response"] = combine_answers(
            state["user_message"], [(r["agent"], r["response"]) for r in responses]
        )
    elif responses:
        state["final_response"] = responses[0]["response"]
    else:
        state["final_response"] = (
            "I couldn't produce an answer just now - please try rephrasing your question."
        )
    return state


def verifier_node(state: EduHiveState) -> EduHiveState:
    """Structured verdict; at most one corrective pass."""
    from app.agents.coordinator import specialists

    rec: TraceRecorder = state["recorder"]

    if not state.get("needs_verification"):
        rec.skip(trace_mod.STEP_VERIFIER, "Verification",
                 "single-agent answer with confident routing - not required")
        state["verification"] = None
        return state

    verdict = verify(state["user_message"], state.get("final_response", ""))

    if verdict.get("status") == "skipped":
        rec.skip(trace_mod.STEP_VERIFIER, "Verification", verdict.get("detail", "unavailable"))
        state["verification"] = verdict
        return state

    if verdict.get("passed"):
        conf = verdict.get("confidence")
        rec.add(trace_mod.STEP_VERIFIER, "Verification passed",
                f"confidence {conf:.2f}" if conf is not None else "no issues found",
                confidence=conf)
    else:
        issues = verdict.get("issues", [])
        rec.add(trace_mod.STEP_VERIFIER, "Verification failed - correcting",
                "; ".join(issues)[:160], status="failed", issues=issues)
        primary = specialists.get(state["primary_agent"])
        if primary is not None:
            try:
                state["final_response"] = correct(
                    state["user_message"], state["final_response"],
                    issues, primary.system_prompt,
                )
                rec.add(trace_mod.STEP_VERIFIER, "Corrected answer issued",
                        "one corrective pass applied (retry limit reached)")
            except Exception as exc:
                logger.exception("Correction pass failed")
                rec.fail(trace_mod.STEP_VERIFIER, "Correction failed", str(exc)[:120])

    state["verification"] = verdict
    return state


def knowledge_check_node(state: EduHiveState) -> EduHiveState:
    """Generate a short check so teaching can feed the mastery loop."""
    rec: TraceRecorder = state["recorder"]

    if not state.get("needs_knowledge_check"):
        rec.skip(trace_mod.STEP_KNOWLEDGE_CHECK, "Knowledge check",
                 "not a teaching turn - skipped")
        state["knowledge_check"] = None
        return state

    if not llm_available():
        rec.skip(trace_mod.STEP_KNOWLEDGE_CHECK, "Knowledge check", "no LLM configured")
        state["knowledge_check"] = None
        return state

    retrieved = state.get("retrieved", [])
    topic = retrieved[0]["topic"] if retrieved else None
    subject = state["primary_agent"]

    try:
        question = complete(
            language_directive(state.get("language"))
            + "You write ONE short quiz question to check understanding. "
              "Reply with only the question - no preamble, answer, or numbering.",
            f"The student just learned about this:\n{state['final_response'][:1200]}\n\n"
            f"Write one short question checking that understanding.",
            max_tokens=400,
        ).strip()

        if is_real_answer(question):
            state["knowledge_check"] = {
                "question": question, "subject": subject, "topic": topic,
            }
            rec.add(trace_mod.STEP_KNOWLEDGE_CHECK, "Knowledge check generated",
                    question[:120], subject=subject, topic=topic)
        else:
            state["knowledge_check"] = None
            rec.skip(trace_mod.STEP_KNOWLEDGE_CHECK, "Knowledge check", "no question produced")
    except Exception as exc:
        logger.exception("Knowledge check generation failed")
        rec.fail(trace_mod.STEP_KNOWLEDGE_CHECK, "Knowledge check failed", str(exc)[:120])
        state["knowledge_check"] = None
    return state


def update_mastery(state: EduHiveState) -> EduHiveState:
    """Persist the turn and refresh recommendations.

    Mastery scores themselves change on *answered* assessments, via the
    existing Progress Engine - this node does not invent a second model.
    """
    rec: TraceRecorder = state["recorder"]
    student_id = state["student_id"]
    conversation_id = state.get("conversation_id")

    log_routing(
        student_id=student_id, conversation_id=conversation_id,
        message=(state.get("routing_text") or state.get("user_message") or "")[:2000],
        agent=state["primary_agent"], confidence=state["router_confidence"],
        used_llm_fallback=state.get("used_llm_fallback", False),
        routed_reason=state.get("routed_reason", ""),
    )

    if conversation_id:
        stored = state.get("user_message") or ""
        if state.get("image"):
            stored = f"{stored}\n[image attached]".strip()
        conversation_service.save_message(conversation_id, student_id, "student", stored)
        conversation_service.save_message(conversation_id, student_id, "agent",
                                          state.get("final_response", ""),
                                          agent=state["primary_agent"])

    rec.add(trace_mod.STEP_MASTERY, "Learning state updated",
            "routing logged and conversation saved; mastery changes on the next answered check",
            pending_check=bool(state.get("knowledge_check")))
    state["mastery_updates"] = []
    return state


def recommendation_node(state: EduHiveState) -> EduHiveState:
    rec: TraceRecorder = state["recorder"]
    try:
        ctx = build_context(state["student_id"])
        recs = derive_recommendations(ctx)
        persist_recommendations(state["student_id"], recs)
        top = top_recommendation(ctx)
        state["recommendation"] = top
        if top:
            rec.add(trace_mod.STEP_RECOMMENDATION, "Next best action",
                    f"{top['topic'].replace('_', ' ')} - {top['reason'][:110]}",
                    topic=top["topic"], priority=top.get("priority"))
        else:
            rec.skip(trace_mod.STEP_RECOMMENDATION, "Next best action",
                     "no weak areas identified yet")
    except Exception as exc:
        logger.exception("Recommendation step failed")
        rec.fail(trace_mod.STEP_RECOMMENDATION, "Recommendation failed", str(exc)[:120])
        state["recommendation"] = None
    return state


def finalize_response(state: EduHiveState) -> EduHiveState:
    return state


# ---------------------------------------------------------- graph wiring ---

_NODES = [
    ("ingest_request", ingest_request),
    ("router_result", router_result),
    ("load_student_context", load_student_context),
    ("coordinator_decision", coordinator_decision),
    ("retrieve_knowledge", retrieve_knowledge),
    ("execute_specialists", execute_specialists),
    ("verifier", verifier_node),
    ("knowledge_check", knowledge_check_node),
    ("update_mastery", update_mastery),
    ("recommendation", recommendation_node),
    ("finalize_response", finalize_response),
]

_compiled = None
_compile_attempted = False


def _build_graph():
    """Compile the LangGraph pipeline once, lazily."""
    global _compiled, _compile_attempted
    if _compile_attempted:
        return _compiled
    _compile_attempted = True

    try:
        from langgraph.graph import END, START, StateGraph

        builder = StateGraph(EduHiveState)
        for name, fn in _NODES:
            builder.add_node(name, fn)

        builder.add_edge(START, "ingest_request")
        for (name, _), (next_name, _) in zip(_NODES, _NODES[1:]):
            builder.add_edge(name, next_name)
        builder.add_edge("finalize_response", END)

        _compiled = builder.compile()
        logger.info("LangGraph orchestration compiled (%d nodes)", len(_NODES))
    except Exception:
        logger.exception("LangGraph unavailable; using sequential fallback")
        _compiled = None
    return _compiled


def graph_available() -> bool:
    return _build_graph() is not None


def run_graph(state: EduHiveState) -> EduHiveState:
    """Execute the pipeline, via LangGraph when available.

    The fallback runs the identical node functions in order, so behavior
    is the same either way - orchestration never becomes a single point of
    failure for /api/chat.
    """
    compiled = _build_graph()
    if compiled is not None:
        try:
            return compiled.invoke(state)
        except Exception:
            logger.exception("LangGraph execution failed; falling back to sequential")

    for _, fn in _NODES:
        try:
            state = fn(state)
        except Exception as exc:
            logger.exception("Node failed in sequential fallback")
            state.setdefault("errors", []).append(str(exc))
    return state
