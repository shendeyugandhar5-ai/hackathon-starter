# LearnOS — API Reference

Base URL (local): `http://localhost:8000`
Interactive docs: `/docs` · Read-only reference: `/redoc`

All 14 endpoints below are live. Run `python test_api.py` in `backend/` to verify.

---

## Requirement coverage

| Problem-statement requirement | Where it lives |
|---|---|
| Student chat interface | frontend → `POST /api/chat` |
| Coordinator agent | `agents/coordinator.py` |
| ≥3 specialist agents | 5 agents — `GET /api/agents` |
| Agent routing/delegation | trained router + `routed_reason`, `contributing_agents` |
| Shared student context | `services/context_service.py` → `context_used` in every chat response |
| Learning-progress tracking | `GET /api/students/{id}/mastery` (BKT-updated) |
| Personalized recommendations | `GET /api/students/{id}/recommendations` |
| Conversation history | `GET /api/students/{id}/conversations` + `/conversations/{id}/messages` |

---

## Core

### `POST /api/chat`
The main endpoint. One turn: understand → route → collaborate → verify → remember → recommend.

```json
// Request
{ "student_id": "rahul", "conversation_id": "optional-uuid", "message": "Explain Bayes theorem" }
```

`message` may be empty when `image` (a `data:image/...;base64,...` URL) is supplied;
one of the two is required. Voice input is transcribed in the browser and arrives
as ordinary `message` text.

```json
// Response
{
  "conversation_id": "b0c1…",
  "agent": "maths",
  "confidence": 0.58,
  "routed_reason": "Trained router matched 'maths' with confidence 0.58 | strategy: step_by_step",
  "response": "…",
  "mastery_updates": [],
  "recommendation": { "topic": "conditional_probability", "reason": "Root cause: …", "priority": "high" },
  "contributing_agents": ["maths", "aiml"],
  "context_used": {
    "weak_topics": ["conditional_probability", "probability", "naive_bayes"],
    "prerequisite_gaps": [{ "prerequisite": "conditional_probability", "blocks": "naive_bayes" }],
    "recent_messages": 4
  },

  "teaching_strategy": "step_by_step",
  "supporting_agents": ["aiml"],
  "retrieved_context": [
    { "subject": "aiml", "topic": "naive_bayes", "source": "ml_notes", "score": 0.3475 }
  ],
  "verification": { "passed": true, "confidence": 0.94, "issues": [], "status": "ok" },
  "knowledge_check": { "question": "…", "subject": "maths", "topic": "conditional_probability" },
  "trace_events": [
    { "step": "ml_router", "label": "ML Router -> Maths", "detail": "…",
      "status": "ok", "agent": "maths", "confidence": 0.58, "duration_ms": 202.1, "data": {} }
  ]
}
```

All fields below `context_used` were **added backward-compatibly** — they are
optional, and existing clients that ignore them keep working.

### Agent Trace fields

| Field | Use |
|---|---|
| `trace_events` | Ordered execution record. `status` is `ok` / `skipped` / `failed` — a `skipped` step means the coordinator *chose* not to run it |
| `teaching_strategy` | Adaptive strategy picked from the student's mastery |
| `supporting_agents` | Non-empty means genuine multi-agent collaboration |
| `retrieved_context` | Which knowledge chunks grounded the answer, with scores |
| `verification` | Structured verdict; `status: "skipped"` when not required |
| `knowledge_check` | Generated quiz question, when the turn warranted one |

`trace_events` step ids: `query_received`, `ml_router`, `student_context`,
`coordinator_decision`, `rag_retrieval`, `specialist_response`, `collaboration`,
`verification`, `knowledge_check`, `mastery_update`, `recommendation`, `error`.

### `GET /api/health`
Reports subsystem readiness without exposing any secret:

```json
{
  "status": "ok", "database": "connected",
  "database_details": { "latency_ms": 63.8 },
  "subsystems": {
    "ml_router": true,
    "langgraph": true,
    "rag": { "available": true, "chunks": 19, "backend": "tfidf-cosine",
             "by_subject": { "maths": 5, "aiml": 4, "dsa": 4, "dbms": 4, "general": 2 } },
    "llm_configured": true,
    "progress_engine": { "bkt": true, "dkt_available": false }
  }
}
```

`llm_configured` reports whether a key is *present*, not whether it is valid.

### `GET /api/agents`
All five agents with `name`, `label`, `scope`. Use it to render the agent legend.

---

## Students

| Endpoint | Purpose |
|---|---|
| `POST /api/students` | Create/upsert. Body: `{ id, name, goal }` |
| `GET /api/students/{id}` | Profile: `overall_score`, `topic_count`, `weak_topic_count`, `conversation_count` |
| `GET /api/students/{id}/mastery` | **Student Brain dashboard.** Per-topic scores/states + per-subject rollup |
| `GET /api/students/{id}/trace?limit=20` | **Agent Trace panel.** Every routing decision, newest first |
| `GET /api/students/{id}/recommendations` | Next-best-action, recomputed live from current mastery |
| `GET /api/students/{id}/root-cause` | **Cross-subject prerequisite gaps** — the differentiator |
| `GET /api/students/{id}/conversations` | Conversation list with message counts, for a sidebar |

### `GET /api/students/{id}/root-cause`
```json
{
  "student_id": "rahul",
  "gaps": [{ "prerequisite": "conditional_probability", "score": 0.17,
             "blocks": "naive_bayes", "blocked_score": 0.35, "weight": 0.95 }],
  "summary": "conditional_probability is at 17% and gates naive_bayes (35%). Strengthen the prerequisite first."
}
```

---

## Conversation history

`GET /api/conversations/{conversation_id}/messages` →
`{ conversation_id, messages: [{ id, role, agent, content, created_at }] }`

`role` is `"student"` or `"agent"`; `agent` names which specialist replied.
Pass the same `conversation_id` back into `POST /api/chat` to continue a thread —
the last 6 turns are fed into the agent's context automatically.

---

## Assessment loop (TEACH → TEST → DIAGNOSE → ADAPT)

### `POST /api/knowledge-check`
Generates a quiz question. Omit `topic` and it auto-targets the student's root-cause
prerequisite, then their weakest topic.

```json
{ "student_id": "rahul" }
→ { "topic": "conditional_probability", "question": "…",
    "reason": "Root cause of weakness in naive_bayes" }
```

### `POST /api/assessments`
```json
{ "student_id": "rahul", "subject": "maths", "topic": "conditional_probability",
  "question": "P(A|B) = ?", "student_answer": "P(A)*P(B)", "is_correct": false,
  "confidence_rating": 2, "misconception_type": "formula_misapplication" }
```
Returns `previous_score → new_score` (BKT), the new `state`, the logged
`misconception_logged`, and `escalate_to_human` when the student has failed
a topic 3+ times with mastery still under 40%.

Valid `misconception_type`: `sign_error`, `unit_confusion`, `definition_confusion`,
`off_by_one`, `base_case_missing`, `formula_misapplication`, `logic_error`, `other`.

---

## Suggested demo sequence

1. `POST /api/chat` — "Why does my recursion code run forever?" → **DSA**, show confidence
2. `POST /api/chat` — "Explain Bayes theorem" → **Maths**, dashboard already shows probability weak
3. `GET /api/students/rahul/root-cause` → conditional probability gates Naive Bayes
4. `POST /api/knowledge-check` → auto-targets that exact prerequisite
5. `POST /api/assessments` with a wrong answer → mastery drops, misconception typed, escalation fires
6. `POST /api/chat` — "Why does gradient descent use calculus and how do I implement it?"
   → `contributing_agents: ["aiml", "maths", "dsa"]`, verifier combines them
7. `POST /api/chat` — "I have 2 months before placements" → **General**, reads all four subjects' mastery
8. `GET /api/students/rahul/conversations` → the whole journey persisted
