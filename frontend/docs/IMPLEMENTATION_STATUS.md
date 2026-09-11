# EduHive — Implementation Status

Last verified: backend `test_api.py` → **28 passed, 0 failed, 2 skipped**.

---

## Working end to end

| Capability | Status | Where |
|---|---|---|
| Two-stage routing (trained TF-IDF → LLM fallback) | ✅ | `agents/router.py` |
| LangGraph orchestration (11 nodes) | ✅ | `agents/graph.py` |
| Coordinator decision policy | ✅ | `agents/decision.py` |
| 5 specialist agents + verifier | ✅ | `agents/` |
| Multi-agent collaboration | ✅ | runner-up probability ≥ 0.25 |
| Subject-aware RAG (19 chunks) | ✅ | `knowledge/` |
| Structured verification + 1 retry | ✅ | `agents/verifier_agent.py` |
| Shared student context | ✅ | `services/context_service.py` |
| BKT mastery + root-cause detection | ✅ | `services/progress_engine.py` |
| Recommendations | ✅ | `services/recommendation_engine.py` |
| Conversation history (resumable) | ✅ | `services/conversation_service.py` |
| Real Agent Trace events | ✅ | `services/trace.py` → `AgentTracePanel` |
| Voice input (Web Speech API) | ✅ | `hooks/useSpeechRecognition.js` |
| Image questions (transcribe → route) | ✅ | `agents/llm_client.py` |
| Supabase auth + demo fallback | ✅ | `context/AuthContext.jsx`, `lib/supabase.js` |

## Frontend pages

| Page | Data source |
|---|---|
| **Tutor** | `POST /api/chat` — live chat, Agent Trace, knowledge check, voice, images |
| **Student Brain** | `GET /mastery` + `/root-cause` — live metrics, facets, blocker |
| **History** | `GET /conversations` — real threads, click to resume |
| **Agents** | `GET /api/agents` + `/trace` — live scope, mean confidence, route counts |
| Knowledge Map | mock (`data/mockData.js`) |
| Progress & Roadmap | partly mock — benchmarks/ATS are design-only |

## Verified scenarios

| Test | Result |
|---|---|
| "Explain recursion…" | `dsa` @ 0.78, single agent |
| "Explain Bayes theorem." | `maths` @ 0.87, RAG grounded |
| "Naive Bayes using conditional probability" | `maths` + **`aiml`**, 3 chunks, verified |
| "Why is my normalization answer wrong?" | `dbms`, strategy `worked_example` |
| "Software engineering placement roadmap" | `general` @ 0.74 |
| "Confused about probability in ML" | `maths`, strategy `worked_example` |
| Single-subject question | correctly stays single-agent |
| RAG subject filter | maths content excluded from a dsa-filtered query |

---

## Known gaps

1. **Gemini key is invalid** — the value in `.env` is an OAuth token
   (`AQ.Ab8RN...`); Gemini keys start with `AIza`. Every orchestration stage runs
   and is verified, but agent *prose* is a canned placeholder until the key is
   replaced at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
   Nothing else is blocking.

2. **DKT-LSTM not trained** — BKT is live and running the mastery loop. Run
   `ml/notebooks/02_dkt_training.ipynb` (~5 min) to enable the deep tier and
   produce the loss curve for the pitch.

3. **Knowledge Map / Progress benchmarks still mock** — deliberate: the backend
   has no equivalent data, and the visuals are design-only.

4. **Telemetry is poll-based**, not SSE. `LiveTelemetryStream` reads
   `/students/{id}/trace` with a manual refresh — sufficient for the demo and
   avoids introducing streaming infrastructure.

5. **RAG uses TF-IDF, not embeddings.** Deliberate — see ARCHITECTURE §4.
   `retriever.py` exposes a vector-store-shaped interface, so swapping in
   pgvector is a one-file change.

---

## Run

```powershell
cd backend;  .\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
cd frontend; npm run dev
cd backend;  .\.venv\Scripts\python.exe test_api.py
```
