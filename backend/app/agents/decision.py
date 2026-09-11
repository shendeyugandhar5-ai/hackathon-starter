"""Coordinator decision policy.

Decides, for one student turn:
  - primary agent and any supporting agents
  - teaching strategy, from the student's mastery state
  - whether retrieval is worth doing
  - whether the answer needs verification
  - whether to follow up with a knowledge check

Deliberately rule-based rather than an LLM call. Three reasons: it costs
nothing and adds no latency; it is deterministic, so the Agent Trace shows
the same reasoning every time in a demo; and when a judge asks "why did it
pick those agents?" the answer is a readable rule, not "the model decided".

The expensive judgement calls (teaching, diagnosis, synthesis) stay with
the LLM specialists where they belong.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from app.agents.base import AgentName
from app.agents.router import detect_subjects, subject_scores

# Second-place router probability above which we pull in a supporting agent.
# Set from observed behaviour: a genuinely cross-subject question ("Naive
# Bayes using conditional probability") puts the runner-up around 0.25-0.35,
# while a single-subject question leaves it near 0.1. Too low a threshold
# drags an irrelevant specialist into every answer.
SUPPORTING_AGENT_THRESHOLD = 0.25

# Mastery below this counts as struggling for strategy selection.
WEAK_SCORE = 0.45
STRONG_SCORE = 0.75

# Questions shorter than this rarely need grounding (greetings, "thanks").
MIN_CHARS_FOR_RAG = 12

CONFUSION_MARKERS = (
    "don't understand", "dont understand", "confused", "confusing",
    "stuck", "lost", "no idea", "makes no sense", "still not",
    "i don't get", "i dont get", "why is my", "what's wrong",
    "whats wrong", "wrong answer", "keep getting",
)

CODE_MARKERS = ("```", "def ", "select ", "class ", "for (", "import ", "print(")


@dataclass
class CoordinatorDecision:
    primary_agent: AgentName
    supporting_agents: List[AgentName] = field(default_factory=list)
    teaching_strategy: str = "step_by_step"
    strategy_reason: str = ""
    use_rag: bool = True
    needs_verification: bool = False
    needs_knowledge_check: bool = False
    rationale: str = ""

    @property
    def all_agents(self) -> List[AgentName]:
        return [self.primary_agent] + self.supporting_agents


def _looks_confused(message: str) -> bool:
    lowered = message.lower()
    return any(marker in lowered for marker in CONFUSION_MARKERS)


def _mastery_for_subjects(mastery: List[Dict], subjects: List[str]) -> Optional[float]:
    """Mean mastery across the subjects this question touches."""
    relevant = [m["score"] for m in mastery if m.get("subject") in subjects]
    return sum(relevant) / len(relevant) if relevant else None


def choose_strategy(message: str, mastery: List[Dict], subjects: List[str],
                    weak_topics: List[Dict]) -> tuple[str, str]:
    """Pick a teaching strategy from the student's state, not at random."""
    if _looks_confused(message):
        return ("worked_example",
                "student signalled confusion, so lead with a fully worked example")

    if any(marker in message.lower() for marker in CODE_MARKERS):
        return ("coding_example",
                "question contains code, so answer with a concrete code walkthrough")

    score = _mastery_for_subjects(mastery, subjects)
    if score is None:
        return ("step_by_step",
                "no mastery history for this subject yet, so default to step-by-step")

    weak_here = [w for w in weak_topics if w.get("subject") in subjects]
    if score < WEAK_SCORE or weak_here:
        return ("step_by_step",
                f"mastery in this area is {score:.0%}, so build up step by step")
    if score >= STRONG_SCORE:
        return ("challenge",
                f"mastery is {score:.0%}, so lead with a harder problem rather than basics")
    return ("analogy",
            f"mastery is {score:.0%} - learning, so anchor the idea with an analogy")


def decide(message: str, routed_agent: AgentName, confidence: float,
           mastery: List[Dict], weak_topics: List[Dict]) -> CoordinatorDecision:
    """Turn the router's output plus student state into an execution plan."""

    # --- supporting agents ------------------------------------------------
    supporting: List[AgentName] = []

    if routed_agent != "general":
        # The trained router's full probability distribution decides
        # collaboration: a strong runner-up means a genuinely cross-subject
        # question. Falls back to keyword detection when the model isn't loaded.
        scores = subject_scores(message)
        if scores:
            others = sorted(
                ((a, p) for a, p in scores.items() if a != routed_agent and a != "general"),
                key=lambda pair: pair[1], reverse=True,
            )
            supporting = [a for a, p in others[:1] if p >= SUPPORTING_AGENT_THRESHOLD]
        else:
            supporting = [a for a in detect_subjects(message)
                          if a != routed_agent and a != "general"][:1]

    subjects = [routed_agent] + supporting

    # --- teaching strategy -----------------------------------------------
    strategy, strategy_reason = choose_strategy(message, mastery, subjects, weak_topics)

    # --- retrieval --------------------------------------------------------
    # Skip grounding for trivial/social messages; everything substantive
    # gets subject-filtered retrieval.
    use_rag = len(message.strip()) >= MIN_CHARS_FOR_RAG

    # --- verification -----------------------------------------------------
    # Verify when multiple agents contributed (answers must not contradict),
    # or when the router itself was unsure.
    needs_verification = bool(supporting) or confidence < 0.6

    # --- knowledge check --------------------------------------------------
    # Only after real teaching on a subject, and not for chit-chat or
    # roadmap/motivational turns handled by General.
    needs_knowledge_check = (
        routed_agent != "general"
        and len(message.strip()) >= 20
        and not _looks_confused(message)
    )

    if supporting:
        rationale = (
            f"'{routed_agent}' leads; '{supporting[0]}' supports because the question "
            f"spans both subjects"
        )
    else:
        rationale = f"'{routed_agent}' covers this question alone; no collaboration needed"

    return CoordinatorDecision(
        primary_agent=routed_agent,
        supporting_agents=supporting,
        teaching_strategy=strategy,
        strategy_reason=strategy_reason,
        use_rag=use_rag,
        needs_verification=needs_verification,
        needs_knowledge_check=needs_knowledge_check,
        rationale=rationale,
    )
