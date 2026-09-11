# EduHive — Architecture

> One student. A hive of AI tutors. One intelligent learning journey.

EduHive routes a student's question to the right specialist tutor, grounds the
answer in subject-specific reference material, verifies it, and folds the result
back into a persistent model of what that student knows — showing its work at
every step.

---

## 1. Request flow

```
                          STUDENT (React + Vite)
                                   |
                          POST /api/chat
                                   v
                      ┌────────────────────────┐
                      │  FastAPI  routes/chat  │
                      └───────────┬────────────┘
                                  v
                      ┌────────────────────────┐
                      │  coordinator.coordinate│  OCR (images) -> text
                      └───────────┬────────────┘
                                  v
                   ═══ LangGraph  app/agents/graph.py ═══
                                  |
   1 ingest_request        record the query
   2 router_result         TRAINED TF-IDF classifier  (stage 1, kept)
   3 load_student_context  mastery, misconceptions, prerequisite gaps
   4 coordinator_decision  agents / strategy / whether to ground-verify-quiz
   5 retrieve_knowledge    subject-filtered RAG              [conditional]
   6 execute_specialists   primary (+ supporting) agents
   7 verifier              structured verdict, <=1 correction [conditional]
   8 knowledge_check       generated quiz question            [conditional]
   9 update_mastery        routing log + conversation persisted
  10 recommendation        next-best-action recomputed
  11 finalize_response
                                  |
                                  v
              response + trace_events  ->  Agent Trace panel
```

Every node appends a `TraceEvent`. Steps the coordinator deliberately skips are
recorded as `skipped`, so the panel shows real decisions rather than a fixed
storyboard.

**Image questions run OCR before the graph** (`app/services/ocr.py`). Whenever a
picture is attached, the text is extracted first and the *extracted text* is what
the router classifies, so a photographed question reaches the right specialist
instead of defaulting to General. This is a hard requirement rather than an
optimisation: the chat model is text-only, so a question has to become text
before anyone can answer it.

The engine is `rapidocr-onnxruntime` - pure pip, offline, no Tesseract binary or
system install. Models load on a background thread at startup (~10-15s) so the
first student upload is not the one that pays for it. If OCR finds nothing, the
turn falls back to a vision model when the provider has one, and otherwise says
the image was unreadable. An `ocr_extraction` event is recorded either way, and
the extracted text is returned to the UI so a misread is visible rather than
silently answered.

Known limitation: the bundled recogniser is the Chinese PP-OCRv4 model, which
occasionally drops spaces between English words on small text
(`Q3.Normalizethistableto3NF.`). This degrades the TF-IDF router, not the answer
- the LLM reads merged text fine, and the stage-2 LLM fallback recovers the
subject when stage-1 confidence drops.

---

## 2. Two-stage routing

**Stage 1 — trained classifier** (`app/agents/router.py`)
TF-IDF + Logistic Regression over 1000 generated examples across five classes.
97.8% 5-fold CV. Instant, free, deterministic, and it returns a *probability
distribution*, not just a label.

**Stage 2 — LLM fallback**, only below `ROUTER_CONFIDENCE_THRESHOLD` (0.6).
If the LLM cannot classify (bad key, network failure, unparseable reply) the
coordinator **keeps the trained router's pick** — falling back to a hardcoded
`general` would replace a real prediction with a worse one.

The full distribution also drives collaboration: a runner-up above
`SUPPORTING_AGENT_THRESHOLD` (0.25) means the question genuinely spans two
subjects. That reuses the model already trained instead of keyword matching.

---

## 3. Coordinator decision policy

`app/agents/decision.py` — deliberately **rule-based, not an LLM call**. It costs
nothing, adds no latency, is deterministic across demo runs, and when asked "why
those agents?" the answer is a readable rule.

| Decision | Basis |
|---|---|
| Supporting agents | router runner-up probability >= 0.25 |
| Teaching strategy | student mastery in the relevant subjects |
| Use RAG | message length >= 12 chars (skip social/trivial turns) |
| Verify | multiple agents contributed, **or** routing confidence < 0.6 |
| Knowledge check | a real teaching turn, not General/confusion handling |

**Adaptive strategy selection** — never random:

| Condition | Strategy |
|---|---|
| Student signalled confusion | `worked_example` |
| Message contains code/SQL | `coding_example` |
| Mastery < 45%, or weak topics present | `step_by_step` |
| Mastery >= 75% | `challenge` |
| Otherwise (learning) | `analogy` |
| No history yet | `step_by_step` |

The expensive judgement — teaching, diagnosis, synthesis — stays with the LLM
specialists where it belongs.

---

## 4. RAG knowledge layer

`app/knowledge/` — **subject-aware retrieval**, not a blind search.

```
corpus.py (19 curated chunks)  ->  TF-IDF index  ->  cosine similarity
                                                      + subject filter
                                                      + relevance floor
                                                          |
                                       format_for_prompt  v
                                              specialist agent prompt
```

Every chunk carries `subject`, `topic`, `source`, `difficulty`. Retrieval is
filtered to the primary agent's subject plus any supporting agents' subjects —
a DSA question never retrieves probability notes.

**Why TF-IDF rather than embeddings + a vector DB:** zero new infrastructure and
no model download (it cannot fail at demo time); the corpus is small, where
lexical overlap on technical terms is a strong signal; and no embedding API call
per query. `retriever.py` exposes the same interface a vector store would
(`retrieve(query, subjects, k)` -> ranked chunks with metadata), so swapping in
pgvector or Chroma is a change to that one file.

Extend the corpus by appending to `corpus.py`, or dropping
`docs/<subject>/<topic>.md` files — those are chunked and indexed automatically.

---

## 5. Agents

| Agent | Scope |
|---|---|
| **DSA** | Data structures, algorithms, complexity, debugging |
| **DBMS** | SQL, normalization, ER modeling, transactions, indexing |
| **Maths** | Algebra, calculus, linear algebra, probability, statistics |
| **AIML** | ML/DL concepts, model behavior, training dynamics |
| **General** | Interview prep, roadmaps, motivation, low-confidence fallback |

All four specialists share `BaseAgent.handle`; they differ only by name and
system prompt. **General is a leaf node**: once routed there it answers fully —
it never hands off to a specialist, and no specialist hands off into it. When it
needs mastery data it reads it from the shared context (i.e. the database), not
by forwarding the live question.

**Verifier** (`verifier_agent.py`) has two separate jobs: `combine_answers`
merges multiple specialists into one voice, and `verify` returns a structured
verdict `{passed, confidence, issues}`. It does **not** rewrite every response —
only a failed verdict triggers one corrective pass, capped at one retry.

---

## 6. Learner model

**Shared student context** (`services/context_service.py`) is assembled before
any agent answers: mastery scores, typed misconceptions, prerequisite gaps, and
the last 6 conversation turns. This *is* the memory layer — structured and exact,
which is a better fit here than vector recall.

**Progress Engine** (`services/progress_engine.py`) — two tiers:
- **BKT** — interpretable, cold-start friendly, no training. The default.
- **DKT-LSTM** — loaded from `ml/dkt/` once trained; used after
  `DKT_MIN_INTERACTIONS` (15) so it is only trusted with enough history.

**Root-cause detection** (`find_prerequisite_gaps`) joins mastery against
`student_topic_edges` to find weak topics that *gate* other weak topics — the
cross-subject differentiator, e.g. conditional probability gating Naive Bayes.

**Recommendations** (`services/recommendation_engine.py`) are rule-based and
ranked: prerequisite gaps → weak topics → stalled topics.

---

## 7. Data model

Nine tables in Supabase Postgres (`database/schema.sql`):
`students`, `conversations`, `messages`, `agent_routing_log`, `student_mastery`,
`mistakes`, `student_topic_edges`, `assessments`, `recommendations`, plus three
convenience views. See `docs/API.md` for the full column reference.

`student_mastery` has a composite PK `(student_id, subject, topic)` — required by
the upsert in the assessment loop.

---

## 8. Failure behaviour

No optional subsystem can take down `/api/chat`:

| Subsystem unavailable | Result |
|---|---|
| LangGraph | identical nodes run sequentially |
| LLM | canned placeholder; router keeps its own pick; quiz endpoint returns 503 rather than emitting an error string as a question |
| RAG | answer proceeds ungrounded, trace records the skip |
| Verifier | verdict recorded as `skipped`, answer still returned |
| Database | context is empty, chat still works |

`is_real_answer()` guards every place model output is consumed **as content**
(quiz questions, routing labels, image transcriptions) so placeholders never
surface as if they were real answers.

---

## 9. Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite + Tailwind + Recharts + lucide-react |
| Backend | FastAPI + SQLAlchemy 2.0 |
| Orchestration | LangGraph 1.2 (optional at runtime) |
| Database | Supabase Postgres (session pooler, IPv4) |
| Auth | Supabase Auth, with a local demo-account fallback |
| Classical ML | scikit-learn (router + RAG retrieval) |
| Deep learning | PyTorch (DKT-LSTM, `ml/notebooks/02`) |
| LLM | Gemini via `google-generativeai`, behind `llm_client.py` |

All LLM calls happen server-side. **No provider key ever reaches the frontend.**

---

## 10. Running it

```powershell
# Backend  (from backend/)
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000

# Frontend (from frontend/)
npm run dev

# Full API + orchestration test suite (from backend/)
.\.venv\Scripts\python.exe test_api.py
```

`GET /api/health` reports every subsystem's readiness without exposing secrets.

### Environment variables

Root `.env` (never committed):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase **session pooler** string (port 5432, IPv4) |
| `GEMINI_API_KEY` | Gemini API key — must start with `AIza` |
| `LLM_MODEL` | default `gemini-2.0-flash` |
| `ROUTER_CONFIDENCE_THRESHOLD` | default `0.6` |
| `CORS_ORIGINS` | comma-separated; covers 5173-5175 by default |
| `CORS_ALLOW_ALL` | dev escape hatch; never enable in production |
| `SQL_ECHO` | log every SQL statement (debug only) |

`frontend/.env`:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | backend URL |
| `VITE_DEMO_STUDENT_ID` | demo profile, used **only** when nobody is signed in |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | optional Auth (anon key only) |

> Note: the direct Supabase host `db.<ref>.supabase.co` is IPv6-only and will not
> resolve on most networks. Use the **session pooler** connection string.
